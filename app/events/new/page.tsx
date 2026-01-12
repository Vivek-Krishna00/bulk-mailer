import { CreateEventForm } from "@/app/components/CreateEventForm";

export default function NewEventPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Create New Campaign</h2>
                <p className="text-muted-foreground">
                    Set up your email campaign details and upload recipients.
                </p>
            </div>
            <div className="max-w-2xl">
                <CreateEventForm />
            </div>
        </div>
    );
}
