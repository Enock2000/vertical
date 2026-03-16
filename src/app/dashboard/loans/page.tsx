'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Loader2, Banknote, ArrowDownRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Loan, LoanRepayment, Employee } from '@/lib/data';
import { format, parseISO, isValid } from 'date-fns';
import { IssueLoanDialog } from './components/issue-loan-dialog';
import { RecordRepaymentDialog } from './components/record-repayment-dialog';
import { LoanDetailDialog } from './components/loan-detail-dialog';

export default function LoansPage() {
    const { companyId, employee: currentEmployee } = useAuth();
    const { toast } = useToast();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const loansRef = ref(db, `companies/${companyId}/loans`);
        const repaymentsRef = ref(db, `companies/${companyId}/loanRepayments`);
        const employeesRef = ref(db, 'employees');
        let loansLoaded = false, repaymentsLoaded = false, employeesLoaded = false;

        const checkLoading = () => {
            if (loansLoaded && repaymentsLoaded && employeesLoaded) setLoading(false);
        };

        const loansUnsub = onValue(loansRef, (snapshot: any) => {
            const data = snapshot.val();
            const list: Loan[] = data
                ? Object.keys(data).map(key => ({ ...data[key], id: key }))
                : [];
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLoans(list);
            loansLoaded = true; checkLoading();
        });

        const repaymentsUnsub = onValue(repaymentsRef, (snapshot: any) => {
            const data = snapshot.val();
            const list: LoanRepayment[] = data
                ? Object.keys(data).map(key => ({ ...data[key], id: key }))
                : [];
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRepayments(list);
            repaymentsLoaded = true; checkLoading();
        });

        const employeesUnsub = onValue(employeesRef, (snapshot: any) => {
            const data = snapshot.val();
            const list: Employee[] = data
                ? Object.values<Employee>(data).filter(e => e.companyId === companyId && e.role !== 'Admin')
                : [];
            setEmployees(list);
            employeesLoaded = true; checkLoading();
        });

        return () => { loansUnsub(); repaymentsUnsub(); employeesUnsub(); };
    }, [companyId]);

    const stats = useMemo(() => {
        const totalIssued = loans.reduce((sum, l) => sum + l.amount, 0);
        const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.outstandingBalance, 0);
        const activeCount = loans.filter(l => l.status === 'Active').length;
        const fullyPaidCount = loans.filter(l => l.status === 'Fully Paid').length;
        return { totalIssued, totalOutstanding, activeCount, fullyPaidCount };
    }, [loans]);

    const activeLoans = useMemo(() => loans.filter(l => l.status === 'Active'), [loans]);
    const completedLoans = useMemo(() => loans.filter(l => l.status !== 'Active'), [loans]);

    const currencyFormatter = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' });

    const getStatusBadge = (status: Loan['status']) => {
        switch (status) {
            case 'Active': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>;
            case 'Fully Paid': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fully Paid</Badge>;
            case 'Defaulted': return <Badge variant="destructive">Defaulted</Badge>;
            case 'Written Off': return <Badge variant="outline">Written Off</Badge>;
        }
    };

    const formatDateSafe = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const parsed = parseISO(dateStr);
        return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : 'Invalid Date';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencyFormatter.format(stats.totalIssued)}</div>
                        <p className="text-xs text-muted-foreground">{loans.length} total loans/advances</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{currencyFormatter.format(stats.totalOutstanding)}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeCount} active loans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeCount}</div>
                        <p className="text-xs text-muted-foreground">Currently being repaid</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.fullyPaidCount}</div>
                        <p className="text-xs text-muted-foreground">Completed repayments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Loans & Advances</CardTitle>
                        <CardDescription>Manage employee loans, salary advances, and repayments.</CardDescription>
                    </div>
                    <IssueLoanDialog employees={employees} approverName={currentEmployee?.name || 'Admin'}>
                        <Button size="sm" className="gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Issue Loan/Advance</span>
                        </Button>
                    </IssueLoanDialog>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="active">
                        <TabsList className="mb-4">
                            <TabsTrigger value="active">Active ({activeLoans.length})</TabsTrigger>
                            <TabsTrigger value="repayments">Repayment History ({repayments.length})</TabsTrigger>
                            <TabsTrigger value="all">All Loans ({loans.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="active">
                            {activeLoans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <Banknote className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No active loans</p>
                                    <p className="text-sm">Issue a loan or advance to get started.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Outstanding</TableHead>
                                            <TableHead>Monthly Deduction</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeLoans.map((loan) => (
                                            <TableRow key={loan.id}>
                                                <TableCell className="font-medium">{loan.employeeName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{loan.type}</Badge>
                                                </TableCell>
                                                <TableCell>{currencyFormatter.format(loan.amount)}</TableCell>
                                                <TableCell className="font-semibold text-orange-600">
                                                    {currencyFormatter.format(loan.outstandingBalance)}
                                                </TableCell>
                                                <TableCell>{currencyFormatter.format(loan.monthlyDeduction)}</TableCell>
                                                <TableCell>{formatDateSafe(loan.dueDate)}</TableCell>
                                                <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <RecordRepaymentDialog loan={loan}>
                                                        <Button variant="outline" size="sm">Record Payment</Button>
                                                    </RecordRepaymentDialog>
                                                    <LoanDetailDialog loan={loan} repayments={repayments.filter(r => r.loanId === loan.id)}>
                                                        <Button variant="ghost" size="sm">View</Button>
                                                    </LoanDetailDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        <TabsContent value="repayments">
                            {repayments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <ArrowDownRight className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No repayments recorded</p>
                                    <p className="text-sm">Repayments will appear here once recorded.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {repayments.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{formatDateSafe(r.date)}</TableCell>
                                                <TableCell className="font-medium">{r.employeeName}</TableCell>
                                                <TableCell className="text-green-600 font-semibold">{currencyFormatter.format(r.amount)}</TableCell>
                                                <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                                                <TableCell className="text-muted-foreground">{r.notes || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        <TabsContent value="all">
                            {loans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <Banknote className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No loans or advances</p>
                                    <p className="text-sm">Issue a loan or advance to get started.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Outstanding</TableHead>
                                            <TableHead>Issue Date</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loans.map((loan) => (
                                            <TableRow key={loan.id}>
                                                <TableCell className="font-medium">{loan.employeeName}</TableCell>
                                                <TableCell><Badge variant="outline">{loan.type}</Badge></TableCell>
                                                <TableCell>{currencyFormatter.format(loan.amount)}</TableCell>
                                                <TableCell>{currencyFormatter.format(loan.outstandingBalance)}</TableCell>
                                                <TableCell>{formatDateSafe(loan.issueDate)}</TableCell>
                                                <TableCell>{formatDateSafe(loan.dueDate)}</TableCell>
                                                <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <LoanDetailDialog loan={loan} repayments={repayments.filter(r => r.loanId === loan.id)}>
                                                        <Button variant="ghost" size="sm">View</Button>
                                                    </LoanDetailDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
