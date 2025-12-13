'use client';

import { useState } from 'react';
import { Loader2, UserMinus, CheckCircle2, Circle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Employee, OffboardingReason, OffboardingRecord, OffboardingChecklistItem } from '@/lib/data';
import { defaultOffboardingChecklist } from '@/lib/data';
import { format } from 'date-fns';

interface OffboardEmployeeDialogProps {
    employee: Employee;
    onComplete?: () => void;
    children?: React.ReactNode;
}

const offboardingReasons: { value: OffboardingReason; label: string }[] = [
    { value: 'Resigned', label: 'Resigned' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Terminated', label: 'Terminated' },
    { value: 'Contract Ended', label: 'Contract Ended' },
    { value: 'Redundant', label: 'Redundant / Laid Off' },
    { value: 'Other', label: 'Other' },
];

export function OffboardEmployeeDialog({ employee, onComplete, children }: OffboardEmployeeDialogProps) {
    const { toast } = useToast();
    const { employee: currentUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState<OffboardingReason | ''>('');
    const [otherReason, setOtherReason] = useState('');
    const [lastWorkingDay, setLastWorkingDay] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [exitNotes, setExitNotes] = useState('');
    const [finalSettlement, setFinalSettlement] = useState('');
    const [checklist, setChecklist] = useState<OffboardingChecklistItem[]>(
        defaultOffboardingChecklist.map((item, index) => ({
            ...item,
            id: `item-${index}`,
        }))
    );

    const toggleChecklistItem = (itemId: string) => {
        setChecklist((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        completed: !item.completed,
                        completedAt: !item.completed ? new Date().toISOString() : null,
                        completedBy: !item.completed ? currentUser?.name || null : null,
                    }
                    : item
            )
        );
    };

    const handleOffboard = async () => {
        if (!reason) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please select an offboarding reason.',
            });
            return;
        }

        if (reason === 'Other' && !otherReason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Reason Details Required',
                description: 'Please specify the offboarding reason.',
            });
            return;
        }

        setLoading(true);

        try {
            // Build the offboarding record, only including non-undefined values
            const offboardingRecord: Record<string, unknown> = {
                reason,
                offboardedAt: new Date().toISOString(),
                offboardedBy: currentUser?.name || 'Admin',
                lastWorkingDay,
                checklist: checklist.map(item => ({
                    ...item,
                    completedAt: item.completedAt || null,
                    completedBy: item.completedBy || null,
                    notes: item.notes || null,
                })),
                finalSettlementPaid: false,
            };

            // Only add optional fields if they have values
            if (reason === 'Other' && otherReason.trim()) {
                offboardingRecord.otherReason = otherReason.trim();
            }
            if (exitNotes.trim()) {
                offboardingRecord.exitInterviewNotes = exitNotes.trim();
            }
            if (finalSettlement) {
                offboardingRecord.finalSettlementAmount = parseFloat(finalSettlement);
            }

            await update(ref(db, `employees/${employee.id}`), {
                status: 'Offboarded',
                offboarding: offboardingRecord,
            });

            toast({
                title: 'Employee Offboarded',
                description: `${employee.name} has been successfully offboarded.`,
            });

            setOpen(false);
            onComplete?.();
        } catch (error) {
            console.error('Offboarding error:', error);
            toast({
                variant: 'destructive',
                title: 'Offboarding Failed',
                description: 'Could not offboard employee. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const completedCount = checklist.filter((item) => item.completed).length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Offboard Employee
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserMinus className="h-5 w-5 text-destructive" />
                        Offboard Employee
                    </DialogTitle>
                    <DialogDescription>
                        Complete the offboarding process for <strong>{employee.name}</strong>. This action will archive the employee record.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Exit Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Exit Reason *</Label>
                        <Select value={reason} onValueChange={(val) => setReason(val as OffboardingReason)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {offboardingReasons.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {reason === 'Other' && (
                        <div className="space-y-2">
                            <Label htmlFor="otherReason">Specify Reason *</Label>
                            <Input
                                id="otherReason"
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Enter the reason..."
                            />
                        </div>
                    )}

                    {/* Last Working Day */}
                    <div className="space-y-2">
                        <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                        <Input
                            id="lastWorkingDay"
                            type="date"
                            value={lastWorkingDay}
                            onChange={(e) => setLastWorkingDay(e.target.value)}
                        />
                    </div>

                    {/* Offboarding Checklist */}
                    <div className="space-y-2">
                        <Label>Offboarding Checklist ({completedCount}/{checklist.length})</Label>
                        <div className="border rounded-lg p-3 space-y-2">
                            {checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                    onClick={() => toggleChecklistItem(item.id)}
                                >
                                    {item.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exit Interview Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="exitNotes">Exit Interview Notes</Label>
                        <Textarea
                            id="exitNotes"
                            value={exitNotes}
                            onChange={(e) => setExitNotes(e.target.value)}
                            placeholder="Add any notes from the exit interview..."
                            rows={3}
                        />
                    </div>

                    {/* Final Settlement */}
                    <div className="space-y-2">
                        <Label htmlFor="finalSettlement">Final Settlement Amount (ZMW)</Label>
                        <Input
                            id="finalSettlement"
                            type="number"
                            value={finalSettlement}
                            onChange={(e) => setFinalSettlement(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleOffboard} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Confirm Offboarding
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
