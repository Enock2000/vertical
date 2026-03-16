'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Banknote, TrendingDown, CheckCircle2, AlertTriangle, PieChart } from 'lucide-react';
import type { Loan, LoanRepayment, Employee } from '@/lib/data';
import { format, parseISO, isValid } from 'date-fns';

interface LoansReportsProps {
    loans: Loan[];
    repayments: LoanRepayment[];
    employees: Employee[];
}

export function LoansReports({ loans, repayments, employees }: LoansReportsProps) {
    const currencyFormatter = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' });

    const stats = useMemo(() => {
        const totalIssued = loans.reduce((sum, l) => sum + l.amount, 0);
        const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.outstandingBalance, 0);
        const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
        const activeCount = loans.filter(l => l.status === 'Active').length;
        const fullyPaidCount = loans.filter(l => l.status === 'Fully Paid').length;
        const defaultedCount = loans.filter(l => l.status === 'Defaulted').length;
        const defaultRate = loans.length > 0 ? ((defaultedCount / loans.length) * 100).toFixed(1) : '0.0';
        const loanCount = loans.filter(l => l.type === 'Loan').length;
        const advanceCount = loans.filter(l => l.type === 'Advance').length;

        return { totalIssued, totalOutstanding, totalRepaid, activeCount, fullyPaidCount, defaultedCount, defaultRate, loanCount, advanceCount };
    }, [loans, repayments]);

    // Group by employee for per-employee summary
    const employeeSummary = useMemo(() => {
        const map = new Map<string, { name: string; totalLoans: number; totalAmount: number; outstanding: number; activeLoans: number }>();
        loans.forEach(loan => {
            const existing = map.get(loan.employeeId) || { name: loan.employeeName, totalLoans: 0, totalAmount: 0, outstanding: 0, activeLoans: 0 };
            existing.totalLoans++;
            existing.totalAmount += loan.amount;
            if (loan.status === 'Active') {
                existing.outstanding += loan.outstandingBalance;
                existing.activeLoans++;
            }
            map.set(loan.employeeId, existing);
        });
        return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
    }, [loans]);

    // Monthly repayment trend (last 6 months)
    const monthlyTrend = useMemo(() => {
        const months: Record<string, number> = {};
        repayments.forEach(r => {
            const month = r.date.substring(0, 7); // YYYY-MM
            months[month] = (months[month] || 0) + r.amount;
        });
        return Object.entries(months)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([month, amount]) => {
                const parsed = parseISO(`${month}-01`);
                return { month: isValid(parsed) ? format(parsed, 'MMM yyyy') : month, amount };
            });
    }, [repayments]);

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

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Loans Issued</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencyFormatter.format(stats.totalIssued)}</div>
                        <p className="text-xs text-muted-foreground">{loans.length} total ({stats.loanCount} loans, {stats.advanceCount} advances)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{currencyFormatter.format(stats.totalOutstanding)}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeCount} active loans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{currencyFormatter.format(stats.totalRepaid)}</div>
                        <p className="text-xs text-muted-foreground">{stats.fullyPaidCount} fully paid loans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.defaultRate}%</div>
                        <p className="text-xs text-muted-foreground">{stats.defaultedCount} defaulted loans</p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Overview */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Type Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieChart className="h-4 w-4" />
                            Loan Type Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm">Loans</span>
                                </div>
                                <div className="text-sm font-medium">{stats.loanCount} ({loans.length > 0 ? Math.round((stats.loanCount / loans.length) * 100) : 0}%)</div>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${loans.length > 0 ? (stats.loanCount / loans.length) * 100 : 0}%` }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                                    <span className="text-sm">Advances</span>
                                </div>
                                <div className="text-sm font-medium">{stats.advanceCount} ({loans.length > 0 ? Math.round((stats.advanceCount / loans.length) * 100) : 0}%)</div>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-purple-500" style={{ width: `${loans.length > 0 ? (stats.advanceCount / loans.length) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Repayment Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Monthly Repayment Trend</CardTitle>
                        <CardDescription>Last {monthlyTrend.length} months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyTrend.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No repayment data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {monthlyTrend.map(({ month, amount }) => {
                                    const maxAmount = Math.max(...monthlyTrend.map(t => t.amount));
                                    const widthPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                                    return (
                                        <div key={month} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{month}</span>
                                                <span className="font-medium">{currencyFormatter.format(amount)}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style={{ width: `${widthPercent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Per-Employee Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Employee Loan Summary</CardTitle>
                    <CardDescription>Consolidated view of loans and advances per employee, sorted by outstanding balance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {employeeSummary.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No employee loan data.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Total Loans</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Outstanding</TableHead>
                                    <TableHead>Active Loans</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeeSummary.map((emp) => (
                                    <TableRow key={emp.name}>
                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                        <TableCell>{emp.totalLoans}</TableCell>
                                        <TableCell>{currencyFormatter.format(emp.totalAmount)}</TableCell>
                                        <TableCell className="font-semibold text-orange-600">{currencyFormatter.format(emp.outstanding)}</TableCell>
                                        <TableCell>{emp.activeLoans}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* All Loans Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All Loans & Advances</CardTitle>
                    <CardDescription>Complete list of all company loans and advances.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loans.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No loans to display.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Outstanding</TableHead>
                                    <TableHead>Monthly Deduction</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loans.map(loan => (
                                    <TableRow key={loan.id}>
                                        <TableCell className="font-medium">{loan.employeeName}</TableCell>
                                        <TableCell><Badge variant="outline">{loan.type}</Badge></TableCell>
                                        <TableCell>{currencyFormatter.format(loan.amount)}</TableCell>
                                        <TableCell className={loan.status === 'Active' ? 'text-orange-600 font-semibold' : ''}>
                                            {currencyFormatter.format(loan.outstandingBalance)}
                                        </TableCell>
                                        <TableCell>{currencyFormatter.format(loan.monthlyDeduction)}</TableCell>
                                        <TableCell>{formatDateSafe(loan.issueDate)}</TableCell>
                                        <TableCell>{formatDateSafe(loan.dueDate)}</TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
