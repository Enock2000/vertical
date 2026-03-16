'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Loan, LoanRepayment } from '@/lib/data';
import { format, parseISO, isValid } from 'date-fns';

interface LoanDetailDialogProps {
    children: React.ReactNode;
    loan: Loan;
    repayments: LoanRepayment[];
}

export function LoanDetailDialog({ loan, repayments, children }: LoanDetailDialogProps) {
    const currencyFormatter = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' });

    const formatDateSafe = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const parsed = parseISO(dateStr);
        return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : 'Invalid Date';
    };
    const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
    const progressPercent = loan.amount > 0 ? Math.min(100, Math.round(((loan.amount + (loan.amount * loan.interestRate / 100) - loan.outstandingBalance) / (loan.amount + (loan.amount * loan.interestRate / 100))) * 100)) : 0;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {loan.type} Details
                        <Badge variant={loan.status === 'Active' ? 'default' : loan.status === 'Fully Paid' ? 'secondary' : 'destructive'}>
                            {loan.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        {loan.type} for {loan.employeeName}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Principal Amount</p>
                                <p className="font-semibold">{currencyFormatter.format(loan.amount)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Interest Rate</p>
                                <p className="font-semibold">{loan.interestRate}%</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className="font-semibold text-orange-600">{currencyFormatter.format(loan.outstandingBalance)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Repaid</p>
                                <p className="font-semibold text-green-600">{currencyFormatter.format(totalRepaid)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Monthly Deduction</p>
                                <p className="font-semibold">{currencyFormatter.format(loan.monthlyDeduction)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Repayment Schedule</p>
                                <p className="font-semibold">{loan.repaymentSchedule}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Issue Date</p>
                                <p className="font-semibold">{formatDateSafe(loan.issueDate)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="font-semibold">{formatDateSafe(loan.dueDate)}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Repayment Progress</span>
                                <span className="font-medium">{progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {loan.notes && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="text-sm">{loan.notes}</p>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Repayment History */}
                        <div>
                            <h4 className="font-semibold mb-2">Repayment History ({repayments.length})</h4>
                            {repayments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No repayments recorded yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {repayments.map(r => (
                                            <TableRow key={r.id}>
                                                <TableCell>{formatDateSafe(r.date)}</TableCell>
                                                <TableCell className="text-green-600 font-medium">{currencyFormatter.format(r.amount)}</TableCell>
                                                <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <Separator />
                        <p className="text-xs text-muted-foreground">Approved by: {loan.approvedBy} • Created: {formatDateSafe(loan.createdAt)}</p>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
