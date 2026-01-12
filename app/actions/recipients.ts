'use server'

import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

export async function uploadRecipients(eventId: string, csvContent: string) {
    try {
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        if (!records || records.length === 0) {
            return { success: false, error: "No records found in CSV" };
        }

        // Validate structure (expect 'email' column)
        const validRecords = records.filter((r: any) => r.email && r.email.includes("@"));

        if (validRecords.length === 0) {
            return { success: false, error: "No valid emails found" };
        }

        const recipientData = validRecords.map((r: any) => ({
            eventId,
            email: r.email,
            name: r.name || null,
            metadata: r, // Store all columns as metadata
        }));

        // Batch insert using createMany
        const result = await prisma.recipient.createMany({
            data: recipientData,
            skipDuplicates: true, // Avoid unique constraint errors if email+event combo was unique (it's not unique in schema currently, but good practice)
        });

        revalidatePath(`/events/${eventId}`);
        return { success: true, count: result.count };
    } catch (error) {
        console.error("Failed to upload recipients:", error);
        return { success: false, error: "Failed to process CSV" };
    }
}
