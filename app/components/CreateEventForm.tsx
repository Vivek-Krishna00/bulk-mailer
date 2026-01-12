"use client";

import { createEvent } from "@/app/actions/events";
import { uploadRecipients } from "@/app/actions/recipients";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is installed/configured

export function CreateEventForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            subject: formData.get("subject") as string,
            fromName: formData.get("fromName") as string,
            fromEmail: formData.get("fromEmail") as string,
            template: formData.get("template") as string,
        };

        try {
            // 1. Create Event
            const res = await createEvent(data);
            if (!res.success || !res.event) {
                throw new Error(res.error || "Failed to create event");
            }

            const eventId = res.event.id;

            // 2. Upload Recipients (if file selected)
            if (csvFile) {
                const text = await csvFile.text();
                const uploadRes = await uploadRecipients(eventId, text);
                if (!uploadRes.success) {
                    toast.error("Event created but CSV upload failed: " + uploadRes.error);
                } else {
                    toast.success(`Event created with ${uploadRes.count} recipients!`);
                }
            } else {
                toast.success("Event created (no recipients added)");
            }

            router.push(`/events/${eventId}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <form onSubmit={onSubmit}>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name (Internal)</Label>
                            <Input id="name" name="name" placeholder="e.g. Weekly Newsletter" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input id="subject" name="subject" placeholder="Welcome to our service!" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fromName">From Name</Label>
                            <Input id="fromName" name="fromName" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fromEmail">From Email</Label>
                            <Input id="fromEmail" name="fromEmail" type="email" placeholder="john@example.com" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template">HTML Template</Label>
                        <Textarea
                            id="template"
                            name="template"
                            placeholder="<html><body><h1>Hello {{name}},</h1>...</body></html>"
                            className="min-h-[200px] font-mono"
                            required
                        />
                        <p className="text-xs text-muted-foreground">Supported variables: {'{{name}}'}, {'{{email}}'}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="csv">Recipient CSV</Label>
                        <Input
                            id="csv"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">Headers required: email. Optional: name (and any other columns for metadata)</p>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Campaign"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
