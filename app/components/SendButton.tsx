"use client";

import { sendBulkEmails } from "@/app/actions/mailer";
import { Button } from "@/app/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SendButton({ eventId, disabled }: { eventId: string, disabled?: boolean }) {
    const [loading, setLoading] = useState(false);

    async function handleSend() {
        if (!confirm("Are you sure you want to start sending emails? This process runs in the background.")) return;

        setLoading(true);
        try {
            const res = await sendBulkEmails(eventId);
            if (res.success) {
                toast.success(`Sending started/completed. Sent: ${res.sent}, Failed: ${res.failed}`);
                // Optionally refresh page or poller will pick it up
            } else {
                toast.error(res.error || "Failed");
            }
        } catch (e: any) {
            toast.error("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleSend} disabled={loading || disabled}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Sending..." : "Send Emails"}
        </Button>
    );
}
