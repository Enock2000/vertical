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
import { ref, push, set } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Employee, Loan, LoanType, RepaymentSchedule } from '@/lib/data';

interface IssueLoanDialogProps {
    children: React.ReactNode;
    employees: Employee[];
    approverName: string;
}

export function IssueLoanDialog({ children, employees, approverName }: IssueLoanDialogProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [employeeId, setEmployeeId] = useState('');
    const [type, setType] = useState<LoanType>('Loan');
    const [amount, setAmount] = useState('');
    const [interestRate, setInterestRate] = useState('0');
    const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule>('Monthly');
    const [monthlyDeduction, setMonthlyDeduction] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    const selectedEmployee = employees.find(e => e.id === employeeId);

    const handleSubmit = async () => {
        if (!companyId || !employeeId || !amount || !monthlyDeduction || !dueDate) return;
        setSaving(true);
        try {
            const loansRef = ref(db, `companies/${companyId}/loans`);
            const newRef = push(loansRef);
            const totalAmount = Number(amount) * (1 + Number(interestRate) / 100);
            const loan: Loan = {
                id: newRef.key!,
                companyId,
                employeeId,
                employeeName: selectedEmployee?.name || '',
                type,
                amount: Number(amount),
                outstandingBalance: totalAmount,
                interestRate: Number(interestRate),
                issueDate: new Date().toISOString().split('T')[0],
                dueDate,
                status: 'Active',
                repaymentSchedule,
                monthlyDeduction: Number(monthlyDeduction),
                notes: notes || undefined,
                approvedBy: approverName,
                createdAt: new Date().toISOString(),
            };
            await set(newRef, loan);
            toast({ title: 'Loan Issued', description: `${type} of K${amount} issued to ${selectedEmployee?.name}.` });
            setOpen(false);
            // Reset
            setEmployeeId(''); setAmount(''); setInterestRate('0'); setMonthlyDeduction(''); setDueDate(''); setNotes('');
        } catch (error) {
            console.error('Error issuing loan:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to issue loan.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Issue Loan / Advance</DialogTitle>
                    <DialogDescription>Enter the details for a new employee loan or salary advance.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={employeeId} onValueChange={setEmployeeId}>
                                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={(v) => setType(v as LoanType)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Loan">Loan</SelectItem>
                                        <SelectItem value="Advance">Advance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (ZMW)</Label>
                                <Input type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Interest Rate (%)</Label>
                                <Input type="number" step="0.1" placeholder="e.g. 5" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Repayment Schedule</Label>
                                <Select value={repaymentSchedule} onValueChange={(v) => setRepaymentSchedule(v as RepaymentSchedule)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Per Payroll">Per Payroll</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monthly Deduction (ZMW)</Label>
                                <Input type="number" placeholder="e.g. 500" value={monthlyDeduction} onChange={e => setMonthlyDeduction(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={saving || !employeeId || !amount || !monthlyDeduction || !dueDate}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Issuing...</> : 'Issue Loan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
