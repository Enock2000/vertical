'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, push, set, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { Loader2 } from 'lucide-react';
import type { Loan, LoanRepayment, RepaymentMethod } from '@/lib/data';

interface RecordRepaymentDialogProps {
    children: React.ReactNode;
    loan: Loan;
}

export function RecordRepaymentDialog({ children, loan }: RecordRepaymentDialogProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [amount, setAmount] = useState(String(loan.monthlyDeduction));
    const [method, setMethod] = useState<RepaymentMethod>('Payroll Deduction');
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        if (!companyId || !amount) return;
        const repaymentAmount = Number(amount);
        if (repaymentAmount <= 0 || repaymentAmount > loan.outstandingBalance) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Amount must be between 0 and the outstanding balance.' });
            return;
        }

        setSaving(true);
        try {
            // 1. Create repayment record
            const repaymentsRef = ref(db, `companies/${companyId}/loanRepayments`);
            const newRef = push(repaymentsRef);
            const repayment: LoanRepayment = {
                id: newRef.key!,
                companyId,
                loanId: loan.id,
                employeeId: loan.employeeId,
                employeeName: loan.employeeName,
                amount: repaymentAmount,
                date: new Date().toISOString().split('T')[0],
                method,
                notes: notes || undefined,
            };
            await set(newRef, repayment);

            // 2. Update loan outstanding balance
            const newBalance = loan.outstandingBalance - repaymentAmount;
            const loanUpdates: Partial<Loan> = {
                outstandingBalance: Math.max(0, newBalance),
            };
            if (newBalance <= 0) {
                loanUpdates.status = 'Fully Paid';
            }
            await update(ref(db, `companies/${companyId}/loans/${loan.id}`), loanUpdates);

            toast({
                title: 'Repayment Recorded',
                description: `K${repaymentAmount.toLocaleString()} repayment recorded for ${loan.employeeName}.${newBalance <= 0 ? ' Loan is now fully paid!' : ''}`,
            });
            setOpen(false);
            setNotes('');
        } catch (error) {
            console.error('Error recording repayment:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to record repayment.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Repayment</DialogTitle>
                    <DialogDescription>
                        Record a repayment for {loan.employeeName}&apos;s {loan.type.toLowerCase()}.
                        Outstanding balance: <span className="font-semibold text-foreground">K{loan.outstandingBalance.toLocaleString()}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Amount (ZMW)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            max={loan.outstandingBalance}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as RepaymentMethod)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Payroll Deduction">Payroll Deduction</SelectItem>
                                <SelectItem value="Manual Payment">Manual Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={saving || !amount || Number(amount) <= 0}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : 'Record Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
