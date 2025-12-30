// src/app/dashboard/reporting/views/payroll-reports.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPIStrip } from '../components/kpi-strip';
import { ReportFilters, FilterConfig, commonFilters } from '../components/report-filters';
import { EnhancedDataTable, Column, cellRenderers } from '../components/data-table-enhanced';
import { useDrillDown } from '../components/drill-down-panel';
import {
    DollarSign,
    Receipt,
    FileText,
    Briefcase,
    Clock,
    Download,
    Eye,
    TrendingUp,
    PieChart,
    BarChart3,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
    PieChart as RechartsPie,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import { format } from 'date-fns';
import { downloadPayrollHistory } from '@/lib/export-utils';
import type { Employee, Department, PayrollRun, PayrollConfig } from '@/lib/data';

interface PayrollReportsProps {
    employees: Employee[];
    departments: Department[];
    payrollRuns: PayrollRun[];
    payrollConfig: PayrollConfig | null;
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function PayrollReports({
    employees,
    departments,
    payrollRuns,
    payrollConfig,
    loading = false,
}: PayrollReportsProps) {
    const { open: openDrillDown } = useDrillDown();
    const [activeTab, setActiveTab] = React.useState('summary');
    const [filters, setFilters] = React.useState<Record<string, any>>({});

    const activeEmployees = employees.filter(e => e.status === 'Active');

    const filterConfigs: FilterConfig[] = [
        commonFilters.department(departments.map(d => ({ id: d.id, name: d.name }))),
        commonFilters.dateRange(),
    ];

    const handleFilterChange = (id: string, value: any) => {
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    // Payroll summary calculations
    const payrollSummary = React.useMemo(() => {
        if (payrollRuns.length === 0) {
            return {
                totalGross: 0,
                totalNet: 0,
                totalDeductions: 0,
                totalNAPSA: 0,
                totalNHIMA: 0,
                totalPAYE: 0,
                employeeCount: 0,
            };
        }

        const latestRun = payrollRuns[0];
        const employees = Object.values(latestRun.employees || {});
        return {
            totalGross: employees.reduce((acc, curr) => acc + (curr.grossPay || 0), 0),
            totalNet: employees.reduce((acc, curr) => acc + (curr.netPay || 0), 0),
            totalDeductions: employees.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0),
            totalNAPSA: employees.reduce((acc, curr) => acc + (curr.employeeNapsaDeduction || 0), 0),
            totalNHIMA: employees.reduce((acc, curr) => acc + (curr.employeeNhimaDeduction || 0), 0),
            totalPAYE: employees.reduce((acc, curr) => acc + (curr.taxDeduction || 0), 0),
            employeeCount: employees.length,
        };
    }, [payrollRuns]);

    // Monthly payroll trend
    const payrollTrend = React.useMemo(() => {
        return payrollRuns
            .slice(0, 12)
            .reverse()
            .map(run => {
                const employees = Object.values(run.employees || {});
                return {
                    month: format(new Date(run.runDate), 'MMM yy'),
                    gross: employees.reduce((acc, curr) => acc + (curr.grossPay || 0), 0),
                    net: employees.reduce((acc, curr) => acc + (curr.netPay || 0), 0),
                    deductions: employees.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0),
                };
            });
    }, [payrollRuns]);

    // Statutory contributions breakdown
    const contributionsData = React.useMemo(() => {
        return [
            { name: 'NAPSA', value: payrollSummary.totalNAPSA, color: '#8b5cf6' },
            { name: 'NHIMA', value: payrollSummary.totalNHIMA, color: '#06b6d4' },
            { name: 'PAYE', value: payrollSummary.totalPAYE, color: '#f59e0b' },
        ].filter(d => d.value > 0);
    }, [payrollSummary]);

    // Payroll by department
    const payrollByDept = React.useMemo(() => {
        return departments.map(dept => {
            const deptEmployees = activeEmployees.filter(e => e.departmentId === dept.id);
            const totalSalary = deptEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
            return {
                name: dept.name.length > 12 ? dept.name.slice(0, 12) + '...' : dept.name,
                fullName: dept.name,
                salary: totalSalary,
                count: deptEmployees.length,
                id: dept.id,
            };
        }).filter(d => d.salary > 0).sort((a, b) => b.salary - a.salary);
    }, [departments, activeEmployees]);

    // Overtime trend
    const overtimeTrend = React.useMemo(() => {
        return payrollRuns.slice(0, 6).reverse().map(run => {
            const employees = Object.values(run.employees || {});
            return {
                month: format(new Date(run.runDate), 'MMM'),
                overtime: employees.reduce((acc, curr) => acc + (curr.overtimePay || 0), 0),
                allowances: 0, // Allowances not explicitly tracked in current interface
            };
        });
    }, [payrollRuns]);

    // KPIs based on active tab
    const kpis = React.useMemo(() => {
        switch (activeTab) {
            case 'summary':
                return [
                    {
                        id: 'total-gross',
                        label: 'Total Gross Pay',
                        value: payrollSummary.totalGross,
                        format: 'currency' as const,
                        icon: DollarSign,
                        color: 'green' as const,
                    },
                    {
                        id: 'total-net',
                        label: 'Total Net Pay',
                        value: payrollSummary.totalNet,
                        format: 'currency' as const,
                        icon: DollarSign,
                        color: 'blue' as const,
                    },
                    {
                        id: 'total-deductions',
                        label: 'Total Deductions',
                        value: payrollSummary.totalDeductions,
                        format: 'currency' as const,
                        icon: Receipt,
                        color: 'orange' as const,
                    },
                    {
                        id: 'employees-paid',
                        label: 'Employees Paid',
                        value: payrollSummary.employeeCount,
                        format: 'number' as const,
                        icon: Briefcase,
                        color: 'purple' as const,
                    },
                ];
            case 'tax':
                return [
                    {
                        id: 'napsa',
                        label: 'NAPSA Contributions',
                        value: payrollSummary.totalNAPSA,
                        format: 'currency' as const,
                        icon: FileText,
                        color: 'purple' as const,
                    },
                    {
                        id: 'nhima',
                        label: 'NHIMA Contributions',
                        value: payrollSummary.totalNHIMA,
                        format: 'currency' as const,
                        icon: FileText,
                        color: 'cyan' as const,
                    },
                    {
                        id: 'paye',
                        label: 'PAYE Deductions',
                        value: payrollSummary.totalPAYE,
                        format: 'currency' as const,
                        icon: FileText,
                        color: 'orange' as const,
                    },
                ];
            case 'overtime':
                const latestRun = payrollRuns[0];
                const employees = latestRun ? Object.values(latestRun.employees || {}) : [];
                return [
                    {
                        id: 'total-overtime',
                        label: 'Total Overtime',
                        value: employees.reduce((acc, curr) => acc + (curr.overtimePay || 0), 0),
                        format: 'currency' as const,
                        icon: Clock,
                        color: 'blue' as const,
                    },
                    {
                        id: 'total-allowances',
                        label: 'Total Allowances',
                        value: 0, // Placeholder
                        format: 'currency' as const,
                        icon: DollarSign,
                        color: 'green' as const,
                    },
                ];
            default:
                return [];
        }
    }, [activeTab, payrollSummary, payrollRuns]);

    // Payroll runs table columns
    const payrollColumns: Column<PayrollRun>[] = [
        {
            id: 'period',
            header: 'Pay Period',
            accessor: (row) => format(new Date(row.runDate), 'MMMM yyyy'),
            sortable: true,
        },
        {
            id: 'runDate',
            header: 'Run Date',
            accessor: 'runDate',
            sortable: true,
            render: (value) => cellRenderers.date(value),
        },
        {
            id: 'employees',
            header: 'Employees',
            accessor: (row) => Object.keys(row.employees || {}).length,
            align: 'center',
        },
        {
            id: 'gross',
            header: 'Gross Pay',
            accessor: (row) => Object.values(row.employees || {}).reduce((acc, curr) => acc + (curr.grossPay || 0), 0),
            align: 'right',
            render: (value) => cellRenderers.currency(value),
        },
        {
            id: 'deductions',
            header: 'Deductions',
            accessor: (row) => Object.values(row.employees || {}).reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0),
            align: 'right',
            render: (value) => cellRenderers.currency(value),
        },
        {
            id: 'net',
            header: 'Net Pay',
            accessor: (row) => Object.values(row.employees || {}).reduce((acc, curr) => acc + (curr.netPay || 0), 0),
            align: 'right',
            render: (value) => cellRenderers.currency(value),
        },
        {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={value === 'Completed' ? 'default' : value === 'Pending' ? 'secondary' : 'outline'}>
                    {value}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="summary" className="gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="hidden sm:inline">Summary</span>
                    </TabsTrigger>
                    <TabsTrigger value="tax" className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Tax & Compliance</span>
                    </TabsTrigger>
                    <TabsTrigger value="overtime" className="gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Overtime</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">History</span>
                    </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <ReportFilters
                    filters={filterConfigs}
                    values={filters}
                    onChange={handleFilterChange}
                    onReset={() => setFilters({})}
                    className="mt-4"
                />

                {/* KPI Strip */}
                {kpis.length > 0 && (
                    <div className="mt-4">
                        <KPIStrip kpis={kpis} loading={loading} />
                    </div>
                )}

                {/* Content */}
                <TabsContent value="summary" className="mt-6 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Payroll Trend */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Payroll Cost Trend</CardTitle>
                                <CardDescription>Monthly gross vs net pay over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={payrollTrend}>
                                        <defs>
                                            <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                        <Tooltip formatter={(v: number) => [`K ${v.toLocaleString()}`, '']} />
                                        <Legend />
                                        <Area type="monotone" dataKey="gross" name="Gross" stroke="#8b5cf6" fill="url(#grossGrad)" />
                                        <Area type="monotone" dataKey="net" name="Net" stroke="#10b981" fill="url(#netGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Payroll by Department */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Payroll by Department</CardTitle>
                                <CardDescription>Monthly salary cost per department</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={payrollByDept} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                                        <XAxis type="number" tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: number) => [`K ${v.toLocaleString()}`, 'Salary']} />
                                        <Bar dataKey="salary" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Deductions Breakdown */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Deductions Breakdown</CardTitle>
                                <CardDescription>Statutory contributions share</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RechartsPie>
                                        <Pie
                                            data={contributionsData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {contributionsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [`K ${v.toLocaleString()}`, '']} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tax" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Statutory Contributions Trend</CardTitle>
                            <CardDescription>Monthly NAPSA, NHIMA, and PAYE</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={payrollTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                    <Tooltip formatter={(v: number) => [`K ${v.toLocaleString()}`, '']} />
                                    <Legend />
                                    <Bar dataKey="deductions" name="Total Deductions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overtime" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Overtime & Allowances Trend</CardTitle>
                            <CardDescription>Additional pay over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={overtimeTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                    <Tooltip formatter={(v: number) => [`K ${v.toLocaleString()}`, '']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="overtime" name="Overtime" stroke="#f59e0b" strokeWidth={2} />
                                    <Line type="monotone" dataKey="allowances" name="Allowances" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <EnhancedDataTable
                        data={payrollRuns}
                        columns={payrollColumns}
                        keyField="id"
                        title="Payroll Run History"
                        description="Complete history of all payroll runs"
                        searchPlaceholder="Search payroll runs..."
                        actions={[
                            { id: 'view', label: 'View Details', icon: Eye, onClick: (row) => openDrillDown('payroll-run', `Payroll - ${format(new Date(row.runDate), 'MMMM yyyy')}`, row) },
                            { id: 'export', label: 'Download', icon: Download, onClick: () => downloadPayrollHistory(payrollRuns) },
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
