'use server'

import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import { EventStatus, RecipientStatus } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

// Configure transporter (create once or per request? Per request allows dynamic config if needed, but here we use env)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendBulkEmails(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) return { success: false, error: "Event not found" };

        // Update status to SENDING
        await prisma.event.update({
            where: { id: eventId },
            data: { status: EventStatus.SENDING },
        });

        // Fetch pending recipients
        const recipients = await prisma.recipient.findMany({
            where: { eventId, status: RecipientStatus.PENDING },
            take: 50, // Batch size for safety. In a real worker, we'd loop.
        });

        if (recipients.length === 0) {
            // Mark event as completed if no recipients left
            await prisma.event.update({
                where: { id: eventId },
                data: { status: EventStatus.COMPLETED },
            });
            return { success: true, message: "No pending recipients" };
        }

        let sentCount = 0;
        let failedCount = 0;

        // Process batch
        for (const recipient of recipients) {
            try {
                // Simple template replacement
                let htmlContent = event.template
                    .replace(/{{name}}/g, recipient.name || "")
                    .replace(/{{email}}/g, recipient.email);

                // Add more replacements from metadata if needed
                if (recipient.metadata && typeof recipient.metadata === 'object') {
                    Object.entries(recipient.metadata).forEach(([key, value]) => {
                        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                    });
                }

                const info = await transporter.sendMail({
                    from: `"${event.fromName}" <${event.fromEmail}>`,
                    to: recipient.email,
                    subject: event.subject,
                    html: htmlContent,
                });

                await prisma.recipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: RecipientStatus.SENT,
                        sentAt: new Date(),
                    },
                });
                sentCount++;
            } catch (err: any) {
                console.error(`Failed to send to ${recipient.email}:`, err);
                await prisma.recipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: RecipientStatus.FAILED,
                        error: err.message || "Unknown error",
                    },
                });
                failedCount++;
            }
        }

        revalidatePath(`/events/${eventId}`);
        return { success: true, sent: sentCount, failed: failedCount };

    } catch (error) {
        console.error("Bulk send error:", error);
        return { success: false, error: "Failed to execute bulk send" };
    }
}
