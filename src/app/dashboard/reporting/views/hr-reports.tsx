// src/app/dashboard/reporting/views/hr-reports.tsx
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
    Users,
    Clock,
    Award,
    UserMinus,
    BarChart3,
    Download,
    Eye,
    ArrowUpRight,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
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
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { format, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { downloadEmployeeRoster } from '@/lib/export-utils';
import type {
    Employee,
    Department,
    AttendanceRecord,
    LeaveRequest,
    PerformanceReview,
    ResignationRequest,
} from '@/lib/data';

interface HRReportsProps {
    employees: Employee[];
    departments: Department[];
    allAttendance: Record<string, Record<string, AttendanceRecord>>;
    leaveRequests: LeaveRequest[];
    performanceReviews: PerformanceReview[];
    resignationRequests: ResignationRequest[];
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function HRReports({
    employees,
    departments,
    allAttendance,
    leaveRequests,
    performanceReviews,
    resignationRequests,
    loading = false,
}: HRReportsProps) {
    const { open: openDrillDown } = useDrillDown();
    const [activeTab, setActiveTab] = React.useState('headcount');
    const [filters, setFilters] = React.useState<Record<string, any>>({});

    const activeEmployees = employees.filter(e => e.status === 'Active');

    // Filter configurations
    const filterConfigs: FilterConfig[] = [
        commonFilters.department(departments.map(d => ({ id: d.id, name: d.name }))),
        commonFilters.dateRange(),
        commonFilters.search(),
    ];

    const handleFilterChange = (id: string, value: any) => {
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const handleResetFilters = () => {
        setFilters({});
    };

    // Headcount by department
    const headcountData = React.useMemo(() => {
        return departments.map(dept => {
            const deptEmployees = activeEmployees.filter(e => e.departmentId === dept.id);
            return {
                name: dept.name.length > 15 ? dept.name.slice(0, 15) + '...' : dept.name,
                fullName: dept.name,
                total: deptEmployees.length,
                male: deptEmployees.filter(e => e.gender === 'Male').length,
                female: deptEmployees.filter(e => e.gender === 'Female').length,
                id: dept.id,
            };
        }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
    }, [departments, activeEmployees]);

    // Attendance summary
    const attendanceSummary = React.useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayRecords = allAttendance[today] || {};

        const present = Object.values(todayRecords).filter(r =>
            r.status === 'Present' || r.status === 'Late'
        ).length;
        const absent = Object.values(todayRecords).filter(r => r.status === 'Absent').length;
        const late = Object.values(todayRecords).filter(r => r.status === 'Late').length;
        const onLeave = leaveRequests.filter(l =>
            l.status === 'Approved' &&
            isWithinInterval(new Date(), {
                start: parseISO(l.startDate),
                end: parseISO(l.endDate)
            })
        ).length;

        return { present, absent, late, onLeave, total: activeEmployees.length };
    }, [allAttendance, leaveRequests, activeEmployees]);

    // Leave types distribution
    const leaveTypesData = React.useMemo(() => {
        const types: Record<string, number> = {};
        leaveRequests.filter(l => l.status === 'Approved').forEach(req => {
            types[req.leaveType] = (types[req.leaveType] || 0) + 1;
        });
        return Object.entries(types).map(([name, value]) => ({ name, value }));
    }, [leaveRequests]);

    // Performance distribution
    const performanceData = React.useMemo(() => {
        const byDept: Record<string, { name: string; avgRating: number; count: number }> = {};

        performanceReviews.forEach(review => {
            const employee = employees.find(e => e.id === review.employeeId);
            if (!employee) return;

            const deptName = employee.departmentName || 'Unknown';
            if (!byDept[deptName]) {
                byDept[deptName] = { name: deptName, avgRating: 0, count: 0 };
            }
            byDept[deptName].avgRating += review.overallRating || 0;
            byDept[deptName].count++;
        });

        return Object.values(byDept).map(d => ({
            ...d,
            avgRating: d.count > 0 ? d.avgRating / d.count : 0,
        }));
    }, [performanceReviews, employees]);

    // Turnover data
    const turnoverData = React.useMemo(() => {
        const months: { month: string; hired: number; left: number; }[] = [];

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const hired = employees.filter(e => {
                if (!e.hireDate) return false;
                const hireDate = parseISO(e.hireDate);
                return isWithinInterval(hireDate, { start: monthStart, end: monthEnd });
            }).length;

            const left = resignationRequests.filter(r => {
                if (!r.requestedDate || r.status !== 'Approved') return false;
                const reqDate = parseISO(r.requestedDate);
                return isWithinInterval(reqDate, { start: monthStart, end: monthEnd });
            }).length;

            months.push({
                month: format(date, 'MMM'),
                hired,
                left,
            });
        }

        return months;
    }, [employees, resignationRequests]);

    // KPIs for the current view
    const kpis = React.useMemo(() => {
        switch (activeTab) {
            case 'headcount':
                return [
                    {
                        id: 'total-employees',
                        label: 'Total Employees',
                        value: activeEmployees.length,
                        format: 'number' as const,
                        icon: Users,
                        color: 'blue' as const,
                    },
                    {
                        id: 'departments',
                        label: 'Departments',
                        value: departments.length,
                        format: 'number' as const,
                        icon: BarChart3,
                        color: 'purple' as const,
                    },
                    {
                        id: 'avg-dept-size',
                        label: 'Avg. Dept Size',
                        value: Math.round(activeEmployees.length / (departments.length || 1)),
                        format: 'number' as const,
                        icon: Users,
                        color: 'cyan' as const,
                    },
                ];
            case 'attendance':
                return [
                    {
                        id: 'present-today',
                        label: 'Present Today',
                        value: attendanceSummary.present,
                        format: 'number' as const,
                        icon: CheckCircle,
                        color: 'green' as const,
                        trend: {
                            value: Math.round((attendanceSummary.present / attendanceSummary.total) * 100),
                            direction: 'neutral' as const,
                            label: '% of workforce',
                        },
                    },
                    {
                        id: 'absent-today',
                        label: 'Absent Today',
                        value: attendanceSummary.absent,
                        format: 'number' as const,
                        icon: AlertCircle,
                        color: 'orange' as const,
                    },
                    {
                        id: 'late-today',
                        label: 'Late Arrivals',
                        value: attendanceSummary.late,
                        format: 'number' as const,
                        icon: Clock,
                        color: 'pink' as const,
                    },
                    {
                        id: 'on-leave',
                        label: 'On Leave',
                        value: attendanceSummary.onLeave,
                        format: 'number' as const,
                        icon: Calendar,
                        color: 'cyan' as const,
                    },
                ];
            case 'performance':
                const avgRating = performanceReviews.length > 0
                    ? performanceReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / performanceReviews.length
                    : 0;
                return [
                    {
                        id: 'total-reviews',
                        label: 'Total Reviews',
                        value: performanceReviews.length,
                        format: 'number' as const,
                        icon: Award,
                        color: 'purple' as const,
                    },
                    {
                        id: 'avg-rating',
                        label: 'Avg. Rating',
                        value: avgRating.toFixed(1),
                        icon: TrendingUp,
                        color: avgRating >= 3.5 ? 'green' as const : 'orange' as const,
                    },
                ];
            case 'turnover':
                const turnoverRate = activeEmployees.length > 0
                    ? (resignationRequests.filter(r => r.status === 'Approved').length / activeEmployees.length) * 100
                    : 0;
                return [
                    {
                        id: 'turnover-rate',
                        label: 'Turnover Rate',
                        value: turnoverRate,
                        format: 'percentage' as const,
                        icon: UserMinus,
                        color: turnoverRate > 10 ? 'orange' as const : 'green' as const,
                    },
                    {
                        id: 'resignations',
                        label: 'Resignations YTD',
                        value: resignationRequests.filter(r => r.status === 'Approved').length,
                        format: 'number' as const,
                        icon: TrendingDown,
                        color: 'pink' as const,
                    },
                ];
            default:
                return [];
        }
    }, [activeTab, activeEmployees, departments, attendanceSummary, performanceReviews, resignationRequests]);

    // Employee table columns
    const employeeColumns: Column<Employee>[] = [
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
            filterable: true,
        },
        {
            id: 'role',
            header: 'Role',
            accessor: 'role',
            sortable: true,
        },
        {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            sortable: true,
            render: (value) => cellRenderers.status(value, value === 'Active' ? 'default' : 'secondary'),
        },
        {
            id: 'hireDate',
            header: 'Hire Date',
            accessor: 'hireDate',
            sortable: true,
            render: (value) => value ? cellRenderers.date(value) : '-',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="headcount" className="gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Headcount</span>
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2">
                        <Award className="h-4 w-4" />
                        <span className="hidden sm:inline">Performance</span>
                    </TabsTrigger>
                    <TabsTrigger value="turnover" className="gap-2">
                        <UserMinus className="h-4 w-4" />
                        <span className="hidden sm:inline">Turnover</span>
                    </TabsTrigger>
                    <TabsTrigger value="master" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Master List</span>
                    </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <ReportFilters
                    filters={filterConfigs}
                    values={filters}
                    onChange={handleFilterChange}
                    onReset={handleResetFilters}
                    className="mt-4"
                />

                {/* KPI Strip */}
                {kpis.length > 0 && (
                    <div className="mt-4">
                        <KPIStrip kpis={kpis} loading={loading} />
                    </div>
                )}

                {/* Content */}
                <TabsContent value="headcount" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Headcount by Department</CardTitle>
                            <CardDescription>Employee distribution with gender breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={headcountData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="male" name="Male" fill="#3b82f6" stackId="a" />
                                    <Bar dataKey="female" name="Female" fill="#ec4899" stackId="a" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Leave Type Distribution</CardTitle>
                            <CardDescription>Approved leaves by type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={leaveTypesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Leaves" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Department Performance</CardTitle>
                            <CardDescription>Average rating by department</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <RadarChart data={performanceData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 5]} />
                                    <Radar
                                        name="Avg Rating"
                                        dataKey="avgRating"
                                        stroke="#8b5cf6"
                                        fill="#8b5cf6"
                                        fillOpacity={0.3}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="turnover" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Hiring vs Attrition Trend</CardTitle>
                            <CardDescription>Last 6 months movement</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={turnoverData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="hired"
                                        name="Hired"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: '#10b981' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="left"
                                        name="Left"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#ef4444' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="master" className="mt-6">
                    <EnhancedDataTable
                        data={employees}
                        columns={employeeColumns}
                        keyField="id"
                        title="Employee Master List"
                        description="Complete list of all employees"
                        searchPlaceholder="Search employees..."
                        actions={[
                            { id: 'view', label: 'View', icon: Eye, onClick: (row) => openDrillDown('employee', row.name, row) },
                            { id: 'export', label: 'Export', icon: Download, onClick: () => downloadEmployeeRoster(employees) },
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div >
    );
}
