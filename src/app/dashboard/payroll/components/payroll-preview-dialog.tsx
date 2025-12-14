'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Eye,
    Loader2,
    ArrowRight,
    Shield,
} from 'lucide-react';
import type { Employee, PayrollDetails, PayrollRun } from '@/lib/data';
import { format } from 'date-fns';

interface PayrollPreviewDialogProps {
    children: React.ReactNode;
    employees: Employee[];
    payrollDetailsMap: Map<string, PayrollDetails>;
    previousPayrollRun: PayrollRun | null;
    periodLabel: string;
    onApprove: () => void;
    onProcess: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
});

type VarianceType = 'increase' | 'decrease' | 'new' | 'none';
type VarianceSeverity = 'high' | 'medium' | 'low' | 'none';

interface EmployeeVariance {
    employee: Employee;
    current: PayrollDetails;
    previous: PayrollDetails | null;
    variance: number;
    variancePercent: number;
    type: VarianceType;
    severity: VarianceSeverity;
    reason: string;
}

export function PayrollPreviewDialog({
    children,
    employees,
    payrollDetailsMap,
    previousPayrollRun,
    periodLabel,
    onApprove,
    onProcess,
}: PayrollPreviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'preview' | 'variances' | 'confirm'>('preview');

    // Calculate variances
    const variances = useMemo(() => {
        const result: EmployeeVariance[] = [];

        employees.forEach(emp => {
            const current = payrollDetailsMap.get(emp.id);
            if (!current) return;

            const previous = previousPayrollRun?.employees?.[emp.id];

            if (!previous) {
                // New employee
                result.push({
                    employee: emp,
                    current,
                    previous: null,
                    variance: current.netPay,
                    variancePercent: 100,
                    type: 'new',
                    severity: 'medium',
                    reason: 'New employee added to payroll',
                });
            } else {
                const variance = current.netPay - previous.netPay;
                const variancePercent = previous.netPay > 0 ? (variance / previous.netPay) * 100 : 0;

                let type: VarianceType = 'none';
                let severity: VarianceSeverity = 'none';
                let reason = 'No significant change';

                if (Math.abs(variancePercent) >= 5) {
                    type = variance > 0 ? 'increase' : 'decrease';

                    if (Math.abs(variancePercent) >= 20) {
                        severity = 'high';
                        reason = `${Math.abs(variancePercent).toFixed(0)}% ${type} - requires review`;
                    } else if (Math.abs(variancePercent) >= 10) {
                        severity = 'medium';
                        reason = `${Math.abs(variancePercent).toFixed(0)}% ${type} - notable change`;
                    } else {
                        severity = 'low';
                        reason = `${Math.abs(variancePercent).toFixed(0)}% ${type} - minor adjustment`;
                    }
                }

                if (severity !== 'none' || type !== 'none') {
                    result.push({
                        employee: emp,
                        current,
                        previous,
                        variance,
                        variancePercent,
                        type,
                        severity,
                        reason,
                    });
                }
            }
        });

        return result.sort((a, b) => {
            const severityOrder = { high: 0, medium: 1, low: 2, none: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }, [employees, payrollDetailsMap, previousPayrollRun]);

    // Summary stats
    const summary = useMemo(() => {
        let totalCurrent = 0;
        let totalPrevious = 0;

        payrollDetailsMap.forEach(details => {
            totalCurrent += details.netPay;
        });

        if (previousPayrollRun) {
            Object.values(previousPayrollRun.employees).forEach(emp => {
                totalPrevious += emp.netPay;
            });
        }

        const totalVariance = totalCurrent - totalPrevious;
        const variancePercent = totalPrevious > 0 ? (totalVariance / totalPrevious) * 100 : 0;
        const highSeverityCount = variances.filter(v => v.severity === 'high').length;
        const mediumSeverityCount = variances.filter(v => v.severity === 'medium').length;
        const newEmployees = variances.filter(v => v.type === 'new').length;

        return {
            totalCurrent,
            totalPrevious,
            totalVariance,
            variancePercent,
            highSeverityCount,
            mediumSeverityCount,
            newEmployees,
            employeeCount: employees.length,
        };
    }, [payrollDetailsMap, previousPayrollRun, variances, employees]);

    const getSeverityBadge = (severity: VarianceSeverity) => {
        switch (severity) {
            case 'high':
                return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
            case 'medium':
                return <Badge className="bg-yellow-100 text-yellow-700 gap-1"><AlertCircle className="h-3 w-3" /> Medium</Badge>;
            case 'low':
                return <Badge variant="secondary" className="gap-1">Low</Badge>;
            default:
                return null;
        }
    };

    const handleApproveAndProcess = () => {
        onApprove();
        onProcess();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Payroll Preview - {periodLabel}
                    </DialogTitle>
                    <DialogDescription>
                        Review payroll before processing. Variances are flagged for your attention.
                    </DialogDescription>
                </DialogHeader>

                {/* Step Progress */}
                <div className="px-6 py-3 bg-muted/30 flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'preview' ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
                        <span>Preview</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className={`flex items-center gap-2 ${step === 'variances' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'variances' ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
                        <span>Review Variances</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'confirm' ? 'bg-primary text-white' : 'bg-muted'}`}>3</div>
                        <span>Confirm</span>
                    </div>
                </div>

                <ScrollArea className="h-[55vh] px-6 py-4">
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-sm text-muted-foreground">Employees</p>
                                        <p className="text-2xl font-bold">{summary.employeeCount}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-sm text-muted-foreground">Total Net Pay</p>
                                        <p className="text-2xl font-bold text-green-600">{currencyFormatter.format(summary.totalCurrent)}</p>
                                    </CardContent>
                                </Card>
                                <Card className={summary.totalVariance !== 0 ? (summary.totalVariance > 0 ? 'bg-amber-50 dark:bg-amber-950' : 'bg-green-50 dark:bg-green-950') : ''}>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-sm text-muted-foreground">vs Previous</p>
                                        <p className={`text-2xl font-bold ${summary.totalVariance > 0 ? 'text-amber-600' : summary.totalVariance < 0 ? 'text-green-600' : ''}`}>
                                            {summary.totalVariance >= 0 ? '+' : ''}{currencyFormatter.format(summary.totalVariance)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ({summary.variancePercent >= 0 ? '+' : ''}{summary.variancePercent.toFixed(1)}%)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className={summary.highSeverityCount > 0 ? 'bg-red-50 dark:bg-red-950' : ''}>
                                    <CardContent className="pt-4 text-center">
                                        <p className="text-sm text-muted-foreground">Flagged Items</p>
                                        <p className={`text-2xl font-bold ${summary.highSeverityCount > 0 ? 'text-red-600' : ''}`}>
                                            {summary.highSeverityCount + summary.mediumSeverityCount}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Variance Summary */}
                            {(summary.highSeverityCount > 0 || summary.mediumSeverityCount > 0) && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800 dark:text-amber-200">Variances Detected</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                {summary.highSeverityCount > 0 && <span className="font-semibold">{summary.highSeverityCount} high-severity</span>}
                                                {summary.highSeverityCount > 0 && summary.mediumSeverityCount > 0 && ' and '}
                                                {summary.mediumSeverityCount > 0 && <span>{summary.mediumSeverityCount} medium-severity</span>}
                                                {' '}variance(s) require your review before processing.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {summary.newEmployees > 0 && (
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-blue-800 dark:text-blue-200">New Employees</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                {summary.newEmployees} new employee(s) added to payroll this period.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {variances.length === 0 && (
                                <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium text-green-800 dark:text-green-200">No Significant Variances</p>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Payroll is consistent with previous period. Safe to proceed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'variances' && (
                        <div className="space-y-4">
                            {variances.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Previous</TableHead>
                                            <TableHead>Current</TableHead>
                                            <TableHead>Change</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Reason</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {variances.map(v => (
                                            <TableRow key={v.employee.id}>
                                                <TableCell className="font-medium">{v.employee.name}</TableCell>
                                                <TableCell>{v.previous ? currencyFormatter.format(v.previous.netPay) : '-'}</TableCell>
                                                <TableCell>{currencyFormatter.format(v.current.netPay)}</TableCell>
                                                <TableCell className={v.variance > 0 ? 'text-amber-600' : 'text-green-600'}>
                                                    <div className="flex items-center gap-1">
                                                        {v.variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                        {v.variance >= 0 ? '+' : ''}{currencyFormatter.format(v.variance)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getSeverityBadge(v.severity)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{v.reason}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium">No variances to review</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 text-center">
                                <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Ready to Process</h3>
                                <p className="text-green-700 dark:text-green-300 mt-2">
                                    You have reviewed {variances.length} variance(s).
                                    <br />Payroll for <strong>{summary.employeeCount}</strong> employees totaling <strong>{currencyFormatter.format(summary.totalCurrent)}</strong> is ready.
                                </p>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Pre-Processing Checklist</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Payroll preview reviewed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Variances acknowledged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Total amounts verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 pt-0 flex justify-between">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {step === 'preview' && (
                            <Button onClick={() => setStep(variances.length > 0 ? 'variances' : 'confirm')}>
                                {variances.length > 0 ? 'Review Variances' : 'Confirm'} <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                        {step === 'variances' && (
                            <>
                                <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
                                <Button onClick={() => setStep('confirm')}>
                                    Acknowledge & Continue <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </>
                        )}
                        {step === 'confirm' && (
                            <>
                                <Button variant="outline" onClick={() => setStep('variances')}>Back</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveAndProcess}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Process Payroll
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
