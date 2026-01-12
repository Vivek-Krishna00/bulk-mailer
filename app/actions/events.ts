'use server'

import { prisma } from "@/lib/db";
import { EventStatus } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

export type CreateEventData = {
    subject: string;
    template: string;
    fromName: string;
    fromEmail: string;
    name: string;
};

export async function createEvent(data: CreateEventData) {
    try {
        const event = await prisma.event.create({
            data: {
                ...data,
                status: EventStatus.DRAFT,
            },
        });
        revalidatePath("/events");
        return { success: true, event };
    } catch (error) {
        console.error("Failed to create event:", error);
        return { success: false, error: "Failed to create event" };
    }
}

export async function getEvents() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { recipients: true },
                },
            },
        });
        return { success: true, events };
    } catch (error) {
        console.error("Failed to get events:", error);
        return { success: false, error: "Failed to fetch events" };
    }
}

export async function getEvent(id: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                recipients: {
                    orderBy: { createdAt: "desc" },
                    take: 100, // Limit for UI performance
                },
                _count: {
                    select: { recipients: true },
                },
            },
        });
        return { success: true, event };
    } catch (error) {
        console.error("Failed to get event:", error);
        return { success: false, error: "Failed to fetch event" };
    }
}
