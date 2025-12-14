'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Download,
    Receipt,
    Loader2,
    PlayCircle,
    History,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Banknote,
    ArrowUpRight,
    Filter,
    ChevronLeft,
    ChevronRight,
    Lock,
    Unlock,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Employee, calculatePayroll, PayrollConfig, PayrollDetails, PayrollRun, AttendanceRecord } from '@/lib/data';
import { PayslipDialog } from './components/payslip-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue, push, update, get } from 'firebase/database';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { runPayroll } from '@/ai/flows/run-payroll-flow';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, subMonths, addMonths } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/app/auth-provider';
import { ViewPayrollRunDialog } from './components/view-payroll-run-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type PayrollStatus = 'Draft' | 'Pending' | 'Approved' | 'Paid';

export default function PayrollPage() {
    const { companyId, employee: adminEmployee, company } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceRecord>>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(new Date());
    const [payrollStatus, setPayrollStatus] = useState<PayrollStatus>('Draft');
    const { toast } = useToast();

    const periodKey = format(selectedPeriod, 'yyyy-MM');
    const periodLabel = format(selectedPeriod, 'MMMM yyyy');

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, `companies/${companyId}/payrollConfig`);
        const runsRef = ref(db, `companies/${companyId}/payrollRuns`);
        const attendanceRef = ref(db, `companies/${companyId}/attendance`);

        let loadCount = 0;
        const checkLoading = () => { if (++loadCount >= 4) setLoading(false); };

        const unsubEmployees = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList = Object.values<Employee>(data).filter(
                    e => e.companyId === companyId && e.status === 'Active' && e.role !== 'Admin'
                );
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            checkLoading();
        });

        const unsubConfig = onValue(configRef, (snapshot) => {
            setPayrollConfig(snapshot.val());
            checkLoading();
        });

        const unsubRuns = onValue(runsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const runsList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                })).sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
                setPayrollRuns(runsList);
            } else {
                setPayrollRuns([]);
            }
            checkLoading();
        });

        const unsubAttendance = onValue(attendanceRef, (snapshot) => {
            setAttendanceData(snapshot.val() || {});
            checkLoading();
        });

        return () => {
            unsubEmployees();
            unsubConfig();
            unsubRuns();
            unsubAttendance();
        };
    }, [companyId]);

    // Calculate payroll details for each employee
    const payrollDetailsMap = useMemo(() => {
        if (!payrollConfig || employees.length === 0) {
            return new Map<string, PayrollDetails>();
        }

        const map = new Map<string, PayrollDetails>();
        employees.forEach(employee => {
            const details = calculatePayroll(employee, payrollConfig);
            map.set(employee.id, details);
        });
        return map;
    }, [employees, payrollConfig]);

    // Calculate attendance stats for current period
    const attendanceStats = useMemo(() => {
        const monthStart = startOfMonth(selectedPeriod);
        const monthEnd = endOfMonth(selectedPeriod);
        const today = new Date() < monthEnd ? new Date() : monthEnd;
        const workDays = eachDayOfInterval({ start: monthStart, end: today })
            .filter(d => !isWeekend(d)).length;

        let totalPresent = 0;
        let totalOvertime = 0;
        let totalAbsences = 0;

        employees.forEach(emp => {
            let empPresentDays = 0;
            Object.keys(attendanceData).forEach(dateKey => {
                if (dateKey.startsWith(periodKey) && attendanceData[dateKey][emp.id]) {
                    empPresentDays++;
                    const record = attendanceData[dateKey][emp.id];
                    if (record.overtime) totalOvertime += record.overtime;
                }
            });
            totalPresent += empPresentDays;
            totalAbsences += Math.max(0, workDays - empPresentDays);
        });

        const avgAttendance = employees.length > 0 && workDays > 0
            ? Math.round((totalPresent / (employees.length * workDays)) * 100)
            : 0;

        return { workDays, totalPresent, totalOvertime, totalAbsences, avgAttendance };
    }, [attendanceData, employees, periodKey, selectedPeriod]);

    // Calculate payroll summary
    const payrollSummary = useMemo(() => {
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        let totalNapsa = 0;
        let totalNhima = 0;
        let totalPaye = 0;

        payrollDetailsMap.forEach(details => {
            totalGross += details.grossPay;
            totalDeductions += details.totalDeductions;
            totalNet += details.netPay;
            totalNapsa += details.employeeNapsaDeduction;
            totalNhima += details.employeeNhimaDeduction;
            totalPaye += details.taxDeduction;
        });

        return { totalGross, totalDeductions, totalNet, totalNapsa, totalNhima, totalPaye };
    }, [payrollDetailsMap]);

    const getPayrollDetails = useCallback((employee: Employee) => {
        return payrollDetailsMap.get(employee.id) || null;
    }, [payrollDetailsMap]);

    const handleRunPayroll = async () => {
        if (!companyId || !adminEmployee) return;
        setIsProcessing(true);
        try {
            const result = await runPayroll(companyId, adminEmployee.name);
            if (result.success && result.achFileContent) {
                setPayrollStatus('Paid');
                toast({
                    title: "Payroll Processed Successfully",
                    description: `${employees.length} employees paid. ACH file generated.`
                });
                // Trigger download
                const link = document.createElement("a");
                link.href = result.achFileContent;
                const fileName = `ACH-PAYROLL-${periodKey}.csv`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast({
                    variant: "destructive",
                    title: "Payroll Failed",
                    description: result.message,
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "An Error Occurred",
                description: error.message || "Could not process payroll.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprovePayroll = () => {
        setPayrollStatus('Approved');
        toast({
            title: "Payroll Approved",
            description: `Payroll for ${periodLabel} has been approved and is ready for processing.`,
        });
    };

    const navigatePeriod = (direction: 'prev' | 'next') => {
        setSelectedPeriod(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        setPayrollStatus('Draft');
    };

    const currencyFormatter = new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        minimumFractionDigits: 0,
    });

    const getStatusBadge = (status: PayrollStatus) => {
        switch (status) {
            case 'Draft':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-700"><Unlock className="h-3 w-3 mr-1" /> Draft</Badge>;
            case 'Pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
            case 'Approved':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
            case 'Paid':
                return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
        }
    };

    const tableColumnsDef = columns(getPayrollDetails);
    const tableColumns = [
        ...tableColumnsDef.slice(0, tableColumnsDef.length - 1),
        {
            ...tableColumnsDef[tableColumnsDef.length - 1],
            cell: ({ row }: { row: { original: Employee } }) => {
                const payrollDetails = getPayrollDetails(row.original);
                return (
                    <div className="text-right">
                        <PayslipDialog employee={row.original} payrollDetails={payrollDetails} companyName={company?.name || ''} payslipDate={selectedPeriod}>
                            <Button variant="ghost" size="sm">
                                <Receipt className="mr-2 h-4 w-4" />
                                Payslip
                            </Button>
                        </PayslipDialog>
                    </div>
                );
            }
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading payroll data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Payroll Management</h1>
                            {getStatusBadge(payrollStatus)}
                        </div>
                        <p className="text-emerald-100 mt-1">Process salaries, generate payslips, and manage payments</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigatePeriod('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">{periodLabel}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigatePeriod('next')} disabled={format(selectedPeriod, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Employees</CardTitle>
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{employees.length}</div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Active employees for payroll</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Gross Payroll</CardTitle>
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <DollarSign className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{currencyFormatter.format(payrollSummary.totalGross)}</div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Before deductions</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Deductions</CardTitle>
                        <div className="p-2 bg-red-500 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-900 dark:text-red-100">{currencyFormatter.format(payrollSummary.totalDeductions)}</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">NAPSA: {currencyFormatter.format(payrollSummary.totalNapsa)}</Badge>
                            <Badge variant="outline" className="text-xs">PAYE: {currencyFormatter.format(payrollSummary.totalPaye)}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Net Payroll</CardTitle>
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <Banknote className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{currencyFormatter.format(payrollSummary.totalNet)}</div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Total disbursement</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Overview */}
            <Card className="shadow-lg border-0">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Attendance Overview - {periodLabel}
                            </CardTitle>
                            <CardDescription>Attendance data affects overtime and deductions</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            {attendanceStats.avgAttendance}% Avg. Attendance
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Work Days</p>
                            <p className="text-2xl font-bold">{attendanceStats.workDays}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                            <p className="text-sm text-muted-foreground">Present Records</p>
                            <p className="text-2xl font-bold text-green-600">{attendanceStats.totalPresent}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
                            <p className="text-sm text-muted-foreground">Overtime Hours</p>
                            <p className="text-2xl font-bold text-amber-600">{attendanceStats.totalOvertime} hrs</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                            <p className="text-sm text-muted-foreground">Absences</p>
                            <p className="text-2xl font-bold text-red-600">{attendanceStats.totalAbsences}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs defaultValue="employees" className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="employees" className="gap-2">
                        <Users className="h-4 w-4" /> Employee Payroll
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> Payroll History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="employees">
                    <Card className="shadow-lg border-0">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Run Payroll - {periodLabel}</CardTitle>
                                <CardDescription>Review employee salaries and process payroll</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {payrollStatus === 'Draft' && (
                                    <Button variant="outline" onClick={handleApprovePayroll} disabled={employees.length === 0}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Approve Payroll
                                    </Button>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                            disabled={employees.length === 0 || isProcessing || payrollStatus === 'Paid'}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <PlayCircle className="h-4 w-4" />
                                            )}
                                            {payrollStatus === 'Paid' ? 'Payroll Paid' : 'Process & Pay'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Process Payroll for {periodLabel}?</AlertDialogTitle>
                                            <AlertDialogDescription className="space-y-4">
                                                <p>This will process payroll for <strong>{employees.length} employees</strong> and generate payment files.</p>
                                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                                    <div className="flex justify-between">
                                                        <span>Total Gross:</span>
                                                        <span className="font-semibold">{currencyFormatter.format(payrollSummary.totalGross)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Total Deductions:</span>
                                                        <span>-{currencyFormatter.format(payrollSummary.totalDeductions)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between font-bold text-lg">
                                                        <span>Net Payable:</span>
                                                        <span className="text-green-600">{currencyFormatter.format(payrollSummary.totalNet)}</span>
                                                    </div>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleRunPayroll} className="bg-emerald-600 hover:bg-emerald-700">
                                                Confirm & Process
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={tableColumns} data={employees} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" /> Payroll Run History
                            </CardTitle>
                            <CardDescription>View past payroll runs and download reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {payrollRuns.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Run Date</TableHead>
                                            <TableHead>Employees</TableHead>
                                            <TableHead>Total Paid</TableHead>
                                            <TableHead>Processed By</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrollRuns.slice(0, 10).map((run) => (
                                            <TableRow key={run.id}>
                                                <TableCell className="font-medium">{run.period}</TableCell>
                                                <TableCell>{format(new Date(run.runDate), 'PPP')}</TableCell>
                                                <TableCell>{Object.keys(run.employees).length}</TableCell>
                                                <TableCell>{currencyFormatter.format(run.totalNetPay)}</TableCell>
                                                <TableCell>{run.runBy}</TableCell>
                                                <TableCell className="text-right">
                                                    <ViewPayrollRunDialog payrollRun={run}>
                                                        <Button variant="ghost" size="sm">
                                                            <FileText className="h-4 w-4 mr-2" /> View Details
                                                        </Button>
                                                    </ViewPayrollRunDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mb-3 opacity-50" />
                                    <p className="font-medium">No Payroll History</p>
                                    <p className="text-sm">Run your first payroll to see history here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
