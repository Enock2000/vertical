// src/app/dashboard/reporting/views/executive-dashboard.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPIStrip, defaultKPIs } from '../components/kpi-strip';
import { EnhancedDataTable, Column, cellRenderers } from '../components/data-table-enhanced';
import { useDrillDown } from '../components/drill-down-panel';
import {
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Clock,
    UserPlus,
    UserMinus,
    Briefcase,
    ArrowUpRight,
    BarChart3,
    PieChart,
    Target,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
    AreaChart,
    Area,
} from 'recharts';
import type { Employee, Department, PayrollRun, LeaveRequest, Applicant, JobVacancy, PerformanceReview } from '@/lib/data';

interface ExecutiveDashboardProps {
    employees: Employee[];
    departments: Department[];
    payrollRuns: PayrollRun[];
    leaveRequests: LeaveRequest[];
    applicants: Applicant[];
    jobVacancies: JobVacancy[];
    performanceReviews: PerformanceReview[];
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function ExecutiveDashboard({
    employees,
    departments,
    payrollRuns,
    leaveRequests,
    applicants,
    jobVacancies,
    performanceReviews,
    loading = false,
}: ExecutiveDashboardProps) {
    const { open: openDrillDown } = useDrillDown();

    // Calculate KPIs
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const totalEmployees = activeEmployees.length;

    const thisMonthPayroll = React.useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return payrollRuns
            .filter(run => {
                const runDate = new Date(run.runDate);
                return runDate.getMonth() === currentMonth && runDate.getFullYear() === currentYear;
            })
            .reduce((sum, run) => sum + (run.totalAmount || 0), 0);
    }, [payrollRuns]);

    const activeLeaves = leaveRequests.filter(l => l.status === 'Approved').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;

    const openPositions = jobVacancies.filter(j => j.status === 'Open').length;

    const attritionRate = React.useMemo(() => {
        const terminated = employees.filter(e => e.status === 'Terminated').length;
        return employees.length > 0 ? (terminated / employees.length) * 100 : 0;
    }, [employees]);

    // Department headcount data
    const departmentData = React.useMemo(() => {
        console.log('Departments:', departments);
        console.log('Active Employees:', activeEmployees);

        if (departments.length === 0) {
            // Fallback: Group employees by departmentName if no departments loaded
            const deptCounts: Record<string, number> = {};
            activeEmployees.forEach(emp => {
                const deptName = emp.departmentName || 'Unassigned';
                deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
            });
            return Object.entries(deptCounts).map(([name, count]) => ({
                name: name.length > 12 ? name.slice(0, 12) + '...' : name,
                fullName: name,
                headcount: count,
                id: name,
            })).sort((a, b) => b.headcount - a.headcount);
        }

        return departments.map(dept => ({
            name: dept.name.length > 12 ? dept.name.slice(0, 12) + '...' : dept.name,
            fullName: dept.name,
            headcount: activeEmployees.filter(e => e.departmentId === dept.id).length,
            id: dept.id,
        })).filter(d => d.headcount > 0).sort((a, b) => b.headcount - a.headcount);
    }, [departments, activeEmployees]);

    // Payroll trend data
    const payrollTrend = React.useMemo(() => {
        const last6Months = payrollRuns
            .slice(0, 6)
            .reverse()
            .map(run => {
                const employees = Object.values(run.employees || {});
                return {
                    month: new Date(run.runDate).toLocaleDateString('en-US', { month: 'short' }),
                    gross: employees.reduce((acc, curr) => acc + (curr.grossPay || 0), 0),
                    net: employees.reduce((acc, curr) => acc + (curr.netPay || 0), 0),
                    deductions: employees.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0),
                };
            });
        return last6Months;
    }, [payrollRuns]);

    // Gender distribution
    const genderData = React.useMemo(() => {
        const genderCounts: Record<string, number> = {};
        activeEmployees.forEach(emp => {
            const gender = emp.gender || 'Not Specified';
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
    }, [activeEmployees]);

    // Performance distribution
    const performanceData = React.useMemo(() => {
        const ratings: Record<string, number> = {
            'Excellent': 0,
            'Good': 0,
            'Average': 0,
            'Needs Improvement': 0,
        };
        performanceReviews.forEach(review => {
            const score = review.overallRating || 0;
            if (score >= 4.5) ratings['Excellent']++;
            else if (score >= 3.5) ratings['Good']++;
            else if (score >= 2.5) ratings['Average']++;
            else ratings['Needs Improvement']++;
        });
        return Object.entries(ratings).map(([name, value]) => ({ name, value }));
    }, [performanceReviews]);

    // Recruitment pipeline
    const recruitmentPipeline = React.useMemo(() => {
        const stages = {
            'New': applicants.filter(a => a.status === 'New').length,
            'Screening': applicants.filter(a => a.status === 'Screening').length,
            'Interview': applicants.filter(a => a.status === 'Interview').length,
            'Offer': applicants.filter(a => a.status === 'Offer').length,
            'Hired': applicants.filter(a => a.status === 'Hired').length,
        };
        return Object.entries(stages).map(([name, value]) => ({ name, value }));
    }, [applicants]);

    // Recent hires
    const recentHires = React.useMemo(() => {
        return [...employees]
            .filter(e => e.hireDate)
            .sort((a, b) => new Date(b.hireDate!).getTime() - new Date(a.hireDate!).getTime())
            .slice(0, 5);
    }, [employees]);

    const kpis = [
        {
            ...defaultKPIs.totalEmployees(totalEmployees),
            sparklineData: [40, 45, 48, 52, 55, 58, totalEmployees],
            onClick: () => openDrillDown('employees', 'Employee Breakdown', { employees: activeEmployees }),
        },
        {
            ...defaultKPIs.monthlyPayroll(thisMonthPayroll),
            sparklineData: payrollTrend.map(p => p.net),
            onClick: () => openDrillDown('payroll', 'Payroll Details', { payrollRuns }),
        },
        {
            ...defaultKPIs.activeLeave(activeLeaves, pendingLeaves),
            onClick: () => openDrillDown('leave', 'Leave Status', { leaveRequests }),
        },
        {
            id: 'open-positions',
            label: 'Open Positions',
            value: openPositions,
            format: 'number' as const,
            icon: Briefcase,
            color: 'cyan' as const,
            trend: {
                value: applicants.filter(a => a.status === 'Applied').length,
                direction: 'neutral' as const,
                label: 'new applicants',
            },
            onClick: () => openDrillDown('recruitment', 'Open Positions', { jobVacancies }),
        },
        {
            id: 'attrition-rate',
            label: 'Attrition Rate',
            value: attritionRate,
            format: 'percentage' as const,
            icon: UserMinus,
            color: attritionRate > 10 ? 'orange' as const : 'green' as const,
            trend: {
                value: -2.3,
                direction: 'down' as const,
                label: 'vs last quarter',
            },
        },
        {
            id: 'avg-performance',
            label: 'Avg. Performance',
            value: performanceReviews.length > 0
                ? (performanceReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / performanceReviews.length).toFixed(1)
                : '0.0',
            icon: Target,
            color: 'purple' as const,
        },
    ];

    const recentHiresColumns: Column<Employee>[] = [
        {
            id: 'name',
            header: 'Employee',
            accessor: 'name',
            sortable: true,
            filterable: true,
            render: (value, row) => cellRenderers.avatar(value, row.avatar),
        },
        {
            id: 'department',
            header: 'Department',
            accessor: 'departmentName',
            sortable: true,
        },
        {
            id: 'role',
            header: 'Role',
            accessor: 'role',
        },
        {
            id: 'hireDate',
            header: 'Hired',
            accessor: 'hireDate',
            render: (value) => cellRenderers.date(value),
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 h-32 bg-muted" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <KPIStrip kpis={kpis} loading={loading} />

            {/* Charts Row 1 */}
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {/* Department Headcount */}
                <Card className="xl:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Headcount by Department</CardTitle>
                                <CardDescription>Active employees per department</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1">
                                <BarChart3 className="h-4 w-4" />
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={departmentData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value: number) => [value, 'Employees']}
                                    labelFormatter={(label) => departmentData.find(d => d.name === label)?.fullName || label}
                                />
                                <Bar
                                    dataKey="headcount"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    cursor="pointer"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Gender Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Gender Distribution</CardTitle>
                        <CardDescription>Workforce demographics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <RechartsPie>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {genderData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Payroll Trend */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Payroll Trend</CardTitle>
                                <CardDescription>Last 6 months gross vs net pay</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={payrollTrend}>
                                <defs>
                                    <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `K${(value / 1000).toFixed(0)}`} />
                                <Tooltip
                                    formatter={(value: number) => [`K ${value.toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="gross"
                                    name="Gross Pay"
                                    stroke="#8b5cf6"
                                    fillOpacity={1}
                                    fill="url(#grossGradient)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="net"
                                    name="Net Pay"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#netGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recruitment Pipeline */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Recruitment Pipeline</CardTitle>
                                <CardDescription>Candidates by stage</CardDescription>
                            </div>
                            <Badge variant="secondary">{applicants.length} total</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={recruitmentPipeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Hires Table */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Recent Hires</CardTitle>
                            <CardDescription>Newest team members</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            View All
                            <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <EnhancedDataTable
                        data={recentHires}
                        columns={recentHiresColumns}
                        keyField="id"
                        showSearch={false}
                        showColumnToggle={false}
                        showExport={false}
                        showPagination={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
