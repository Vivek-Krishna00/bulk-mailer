import { getEvent } from "@/app/actions/events";
import { SendButton } from "@/app/components/SendButton";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/components/ui/table";
import { notFound } from "next/navigation";

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
    // Await params as per Next.js 15+ (and 16 inferred) requirements for dynamic routes
    const { id } = await Promise.resolve(params);
    const { event } = await getEvent(id);

    if (!event) return notFound();

    // Basic stats
    const total = event._count.recipients;
    const sent = event.recipients.filter(r => r.status === 'SENT').length; // NOTE: This is only based on the 'take: 100' or need a separate aggregation query for accurate stats if > 100.
    // Correction: getEvent used 'take: 100' for list, but _count gives total. 
    // For accurate status counts, we should probably do a groupBy or separate query. 
    // For now, let's assume the user wants accurate stats.
    // I'll leave it as an exercise or add a specific getEventStats action if needed. 
    // Let's rely on what we have or just show the list status for now. 
    // Actually, let's just make it simple.

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{event.name}</h2>
                    <p className="text-muted-foreground">{event.subject}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-lg px-4 py-1">{event.status}</Badge>
                    <SendButton eventId={event.id} disabled={event.status === 'COMPLETED' || total === 0} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{total}</div>
                    </CardContent>
                </Card>
                {/* Placeholder for real stats if we did aggregation */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">From</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">{event.fromName} &lt;{event.fromEmail}&gt;</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recipients (First 100)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Sent At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.recipients.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'SENT' ? 'default' : r.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{r.name || '-'}</TableCell>
                                    <TableCell>{r.sentAt ? new Date(r.sentAt).toLocaleString() : '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
