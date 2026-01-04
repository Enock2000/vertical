// src/app/employee-portal/components/shift-swap-request-dialog.tsx
'use client';

import { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import type { RosterAssignment, Employee } from '@/lib/data';

interface ShiftSwapRequestDialogProps {
    children: React.ReactNode;
    assignment: RosterAssignment;
    employee: Employee;
    companyId: string;
}

export function ShiftSwapRequestDialog({
    children,
    assignment,
    employee,
    companyId,
}: ShiftSwapRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please provide a reason for the swap request.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const requestsRef = ref(db, `companies/${companyId}/shiftSwapRequests`);
            const newRequestRef = push(requestsRef);

            await set(newRequestRef, {
                id: newRequestRef.key,
                companyId,
                requesterId: employee.id,
                requesterName: employee.name,
                date: assignment.date,
                shiftId: assignment.shiftId || '',
                shiftName: assignment.shiftName || 'Assigned Shift',
                reason: reason.trim(),
                status: 'Pending',
                createdAt: new Date().toISOString(),
            });

            toast({
                title: 'Request Submitted',
                description: 'Your shift swap request has been submitted for review.',
            });
            setOpen(false);
            setReason('');
        } catch (error) {
            console.error('Error submitting swap request:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not submit the request. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-primary" />
                        Request Shift Swap
                    </DialogTitle>
                    <DialogDescription>
                        Submit a request to swap or drop your shift on {assignment.date}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Shift Details</Label>
                        <div className="p-3 rounded-md bg-muted text-sm">
                            <p><strong>Date:</strong> {assignment.date}</p>
                            <p><strong>Shift:</strong> {assignment.shiftName || 'On Duty'}</p>
                            {assignment.startTime && assignment.endTime && (
                                <p><strong>Time:</strong> {assignment.startTime} - {assignment.endTime}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Request *</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Medical appointment, family emergency, prior commitment..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
