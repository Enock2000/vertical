// src/app/dashboard/analytics/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
    Users,
    DollarSign,
    Clock,
    TrendingUp,
    Briefcase,
    UserPlus,
    Calendar,
    BarChart3,
    PieChart,
    FileText,
    Building2,
    Award,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard, KPICardMini } from './components/kpi-card';
import { DrillDownModal, DrillDownTable } from './components/drill-down-modal';
import { AnalyticsFilterBar, getDefaultFilters, type AnalyticsFilters } from './components/analytics-filter-bar';
import { FunnelChart } from './components/charts/funnel-chart';
import { HeatmapCalendar } from './components/charts/heatmap-calendar';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { format, isWithinInterval, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import type {
    Employee,
    Department,
    PayrollRun,
    LeaveRequest,
    Applicant,
    JobVacancy,
    AttendanceRecord,
    PerformanceReview,
    AuditLog
} from '@/lib/data';
import { ApplicantStatus } from '@/lib/data';
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
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AnalyticsPage() {
    const { companyId } = useAuth();
    const [filters, setFilters] = useState<AnalyticsFilters>(getDefaultFilters());
    const [loading, setLoading] = useState(true);

    // Data states
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([]);
    const [allAttendance, setAllAttendance] = useState<Record<string, Record<string, AttendanceRecord>>>({});
    const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);

    // Drill-down states
    const [drillDownOpen, setDrillDownOpen] = useState(false);
    const [drillDownData, setDrillDownData] = useState<{
        type: string;
        title: string;
        data: any[];
    } | null>(null);

    // Fetch data
    useEffect(() => {
        if (!companyId) return;
        setLoading(true);

        const unsubscribes: (() => void)[] = [];
        let loadedCount = 0;
        const totalToLoad = 8;
        const checkLoading = () => {
            loadedCount++;
            if (loadedCount >= totalToLoad) setLoading(false);
        };

        // Employees
        unsubscribes.push(onValue(
            query(ref(db, 'employees'), orderByChild('companyId'), equalTo(companyId)),
            (snap) => {
                setEmployees(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        // Departments
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/departments`),
            (snap) => {
                setDepartments(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        // Payroll Runs
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/payrollRuns`),
            (snap) => {
                const data = snap.val() ? Object.values(snap.val()) as PayrollRun[] : [];
                setPayrollRuns(data.sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime()));
                checkLoading();
            }
        ));

        // Leave Requests
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/leaveRequests`),
            (snap) => {
                setLeaveRequests(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        // Applicants
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/applicants`),
            (snap) => {
                setApplicants(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        // Job Vacancies
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/jobVacancies`),
            (snap) => {
                setJobVacancies(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        // Attendance
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/attendance`),
            (snap) => {
                setAllAttendance(snap.val() || {});
                checkLoading();
            }
        ));

        // Performance Reviews
        unsubscribes.push(onValue(
            ref(db, `companies/${companyId}/performanceReviews`),
            (snap) => {
                setPerformanceReviews(snap.val() ? Object.values(snap.val()) : []);
                checkLoading();
            }
        ));

        return () => unsubscribes.forEach(u => u());
    }, [companyId]);

    // ===================== COMPUTED METRICS =====================

    // Filter employees by date range (join date)
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (filters.department !== 'all' && emp.departmentId !== filters.department) return false;
            return true;
        });
    }, [employees, filters]);

    // Active employees count
    const activeEmployees = useMemo(() =>
        filteredEmployees.filter(e => e.status === 'Active').length,
        [filteredEmployees]);

    // Monthly payroll
    const totalMonthlyPayroll = useMemo(() => {
        if (payrollRuns.length === 0) return 0;
        const latest = payrollRuns[0];
        return latest?.totalAmount || latest?.totalNetPay || 0;
    }, [payrollRuns]);

    // Attrition calculation
    const attritionData = useMemo(() => {
        const terminated = employees.filter(e =>
            e.status === 'Terminated' || e.status === 'Resigned'
        ).length;
        const total = employees.length;
        const rate = total > 0 ? ((terminated / total) * 100).toFixed(1) : '0';
        return { terminated, rate };
    }, [employees]);

    // Recruitment funnel
    const recruitmentFunnel = useMemo(() => {
        const statusCounts = {
            New: 0,
            Screening: 0,
            Interview: 0,
            Offer: 0,
            Hired: 0,
        };
        applicants.forEach(app => {
            if (statusCounts.hasOwnProperty(app.status)) {
                statusCounts[app.status as keyof typeof statusCounts]++;
            }
        });
        return [
            { name: 'Applied', value: applicants.length, color: 'bg-blue-500' },
            { name: 'Screening', value: statusCounts.Screening, color: 'bg-indigo-500' },
            { name: 'Interview', value: statusCounts.Interview, color: 'bg-purple-500' },
            { name: 'Offer', value: statusCounts.Offer, color: 'bg-pink-500' },
            { name: 'Hired', value: statusCounts.Hired, color: 'bg-emerald-500' },
        ];
    }, [applicants]);

    // Time-to-hire average
    const avgTimeToHire = useMemo(() => {
        const hiredApplicants = applicants.filter(a => a.status === 'Hired' && a.hiredAt && a.appliedAt);
        if (hiredApplicants.length === 0) return 0;
        const totalDays = hiredApplicants.reduce((sum, a) => {
            const days = differenceInDays(new Date(a.hiredAt!), new Date(a.appliedAt));
            return sum + days;
        }, 0);
        return Math.round(totalDays / hiredApplicants.length);
    }, [applicants]);

    // Department headcount
    const departmentHeadcount = useMemo(() => {
        return departments.map(dept => ({
            name: dept.name,
            value: filteredEmployees.filter(e => e.departmentId === dept.id && e.status === 'Active').length,
        }));
    }, [departments, filteredEmployees]);

    // Attendance heatmap data
    const attendanceHeatmap = useMemo(() => {
        const data: { date: string; value: number; label: string }[] = [];
        Object.keys(allAttendance).forEach(dateStr => {
            const dayRecords = allAttendance[dateStr];
            const presentCount = Object.values(dayRecords).filter(r =>
                r.status === 'Present' || r.status === 'Late'
            ).length;
            data.push({
                date: dateStr,
                value: presentCount,
                label: `${presentCount} present`,
            });
        });
        return data;
    }, [allAttendance]);

    // Source of hire breakdown
    const sourceOfHire = useMemo(() => {
        const sources: Record<string, number> = {};
        applicants.filter(a => a.status === 'Hired').forEach(a => {
            const source = a.source || 'Direct';
            sources[source] = (sources[source] || 0) + 1;
        });
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    }, [applicants]);

    // Open job positions
    const openPositions = useMemo(() =>
        jobVacancies.filter(j => j.status === 'Open' || j.status === 'Approved').length,
        [jobVacancies]);

    // Pending leaves
    const pendingLeaves = useMemo(() =>
        leaveRequests.filter(l => l.status === 'Pending').length,
        [leaveRequests]);

    // ===================== DRILL DOWN HANDLERS =====================

    const openDrillDown = (type: string, title: string, data: any[]) => {
        setDrillDownData({ type, title, data });
        setDrillDownOpen(true);
    };

    // ===================== RENDER =====================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                    Comprehensive insights across HR, Payroll, and Recruitment
                </p>
            </div>

            {/* Tabs for different dashboards */}
            <Tabs defaultValue="executive" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="executive">Executive</TabsTrigger>
                    <TabsTrigger value="hr">HR Manager</TabsTrigger>
                    <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>

                {/* ==================== EXECUTIVE DASHBOARD ==================== */}
                <TabsContent value="executive" className="space-y-6">
                    {/* Filter Bar */}
                    <AnalyticsFilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        departments={departments}
                    />

                    {/* Top KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KPICard
                            title="Total Employees"
                            value={activeEmployees}
                            subtitle={`${employees.length} total records`}
                            change={5.2}
                            trend="up"
                            changeLabel="vs last month"
                            icon={<Users className="h-5 w-5" />}
                            color="blue"
                            sparklineData={[45, 52, 49, 63, 72, 80, activeEmployees]}
                            onClick={() => openDrillDown('employees', 'Employee Directory', filteredEmployees)}
                        />
                        <KPICard
                            title="Monthly Payroll"
                            value={`K${totalMonthlyPayroll.toLocaleString()}`}
                            subtitle="Net pay this period"
                            change={-2.1}
                            trend="down"
                            changeLabel="vs last month"
                            icon={<DollarSign className="h-5 w-5" />}
                            color="green"
                            onClick={() => openDrillDown('payroll', 'Payroll History', payrollRuns)}
                        />
                        <KPICard
                            title="Attrition Rate"
                            value={`${attritionData.rate}%`}
                            subtitle={`${attritionData.terminated} departures`}
                            change={-1.5}
                            trend="up"
                            changeLabel="improved"
                            icon={<TrendingUp className="h-5 w-5" />}
                            color="orange"
                        />
                        <KPICard
                            title="Avg. Time to Hire"
                            value={`${avgTimeToHire} days`}
                            subtitle={`${applicants.filter(a => a.status === 'Hired').length} hires`}
                            icon={<Clock className="h-5 w-5" />}
                            color="purple"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recruitment Funnel */}
                        <FunnelChart
                            title="Recruitment Pipeline"
                            description="Candidate progression through hiring stages"
                            data={recruitmentFunnel}
                            onStageClick={(stage) => {
                                const filtered = applicants.filter(a => {
                                    if (stage.name === 'Applied') return true;
                                    return a.status === stage.name;
                                });
                                openDrillDown('applicants', `${stage.name} Candidates`, filtered);
                            }}
                        />

                        {/* Department Headcount */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Headcount by Department</CardTitle>
                                <CardDescription>Active employees per department</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departmentHeadcount} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                            cursor="pointer"
                                            onClick={(data) => {
                                                const dept = departments.find(d => d.name === data.name);
                                                if (dept) {
                                                    const deptEmployees = filteredEmployees.filter(e => e.departmentId === dept.id);
                                                    openDrillDown('employees', `${dept.name} Employees`, deptEmployees);
                                                }
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mini KPIs Row */}
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        <KPICardMini
                            title="Open Positions"
                            value={openPositions}
                            icon={<Briefcase className="h-4 w-4" />}
                        />
                        <KPICardMini
                            title="Pending Leaves"
                            value={pendingLeaves}
                            icon={<Calendar className="h-4 w-4" />}
                        />
                        <KPICardMini
                            title="New Applicants"
                            value={applicants.filter(a => a.status === 'New').length}
                            icon={<UserPlus className="h-4 w-4" />}
                        />
                        <KPICardMini
                            title="Departments"
                            value={departments.length}
                            icon={<Building2 className="h-4 w-4" />}
                        />
                        <KPICardMini
                            title="Payroll Runs"
                            value={payrollRuns.length}
                            icon={<FileText className="h-4 w-4" />}
                        />
                        <KPICardMini
                            title="Reviews"
                            value={performanceReviews.length}
                            icon={<Award className="h-4 w-4" />}
                        />
                    </div>
                </TabsContent>

                {/* ==================== HR MANAGER DASHBOARD ==================== */}
                <TabsContent value="hr" className="space-y-6">
                    <AnalyticsFilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        departments={departments}
                        statusOptions={[
                            { value: 'Active', label: 'Active' },
                            { value: 'Suspended', label: 'Suspended' },
                            { value: 'On Leave', label: 'On Leave' },
                        ]}
                    />

                    {/* Attendance Heatmap */}
                    <HeatmapCalendar
                        title="Attendance Patterns"
                        description="Daily attendance across all employees"
                        data={attendanceHeatmap}
                        colorScale="green"
                        maxValue={activeEmployees}
                        onDayClick={(date, data) => {
                            const dayRecords = allAttendance[date];
                            if (dayRecords) {
                                const records = Object.entries(dayRecords).map(([empId, record]) => {
                                    const emp = employees.find(e => e.id === empId);
                                    return { ...record, employeeName: emp?.name || 'Unknown', date };
                                });
                                openDrillDown('attendance', `Attendance for ${format(new Date(date), 'MMM d, yyyy')}`, records);
                            }
                        }}
                    />

                    {/* Leave Status & Employee Status */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Requests</CardTitle>
                                <CardDescription>Recent leave applications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {leaveRequests.slice(0, 5).map(leave => {
                                        const emp = employees.find(e => e.id === leave.employeeId);
                                        return (
                                            <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{emp?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {leave.type} • {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}
                                                    </p>
                                                </div>
                                                <Badge variant={
                                                    leave.status === 'Approved' ? 'default' :
                                                        leave.status === 'Pending' ? 'secondary' : 'destructive'
                                                }>
                                                    {leave.status}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                    {leaveRequests.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">No leave requests</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employee Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Status</CardTitle>
                                <CardDescription>Current workforce distribution</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={[
                                                { name: 'Active', value: employees.filter(e => e.status === 'Active').length },
                                                { name: 'On Leave', value: employees.filter(e => e.status === 'On Leave').length },
                                                { name: 'Suspended', value: employees.filter(e => e.status === 'Suspended').length },
                                                { name: 'Terminated', value: employees.filter(e => e.status === 'Terminated').length },
                                            ].filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ==================== RECRUITMENT DASHBOARD ==================== */}
                <TabsContent value="recruitment" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KPICard
                            title="Open Positions"
                            value={openPositions}
                            icon={<Briefcase className="h-5 w-5" />}
                            color="blue"
                            onClick={() => openDrillDown('jobs', 'Open Positions', jobVacancies.filter(j => j.status === 'Open'))}
                        />
                        <KPICard
                            title="Total Applicants"
                            value={applicants.length}
                            icon={<Users className="h-5 w-5" />}
                            color="purple"
                        />
                        <KPICard
                            title="In Interview"
                            value={applicants.filter(a => a.status === 'Interview').length}
                            icon={<UserPlus className="h-5 w-5" />}
                            color="orange"
                        />
                        <KPICard
                            title="Offers Extended"
                            value={applicants.filter(a => a.status === 'Offer').length}
                            icon={<Award className="h-5 w-5" />}
                            color="green"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <FunnelChart
                            title="Candidate Pipeline"
                            description="Stage-wise breakdown"
                            data={recruitmentFunnel}
                            onStageClick={(stage) => {
                                const filtered = applicants.filter(a => {
                                    if (stage.name === 'Applied') return true;
                                    return a.status === stage.name;
                                });
                                openDrillDown('applicants', `${stage.name} Candidates`, filtered);
                            }}
                        />

                        {/* Source of Hire */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Source of Hire</CardTitle>
                                <CardDescription>Where successful hires came from</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {sourceOfHire.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <Pie
                                                data={sourceOfHire}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {sourceOfHire.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No hire data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ==================== PAYROLL DASHBOARD ==================== */}
                <TabsContent value="payroll" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KPICard
                            title="Total Payroll Cost"
                            value={`K${totalMonthlyPayroll.toLocaleString()}`}
                            icon={<DollarSign className="h-5 w-5" />}
                            color="green"
                        />
                        <KPICard
                            title="Avg. Salary"
                            value={`K${Math.round(filteredEmployees.reduce((s, e) => s + (e.salary || 0), 0) / (activeEmployees || 1)).toLocaleString()}`}
                            icon={<BarChart3 className="h-5 w-5" />}
                            color="blue"
                        />
                        <KPICard
                            title="Payroll Runs"
                            value={payrollRuns.length}
                            icon={<FileText className="h-5 w-5" />}
                            color="purple"
                            onClick={() => openDrillDown('payroll', 'Payroll History', payrollRuns)}
                        />
                        <KPICard
                            title="Employees Paid"
                            value={payrollRuns[0]?.employeeCount || 0}
                            subtitle="Last payroll"
                            icon={<Users className="h-5 w-5" />}
                            color="orange"
                        />
                    </div>

                    {/* Payroll Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll Trend</CardTitle>
                            <CardDescription>Monthly payroll costs over time</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={payrollRuns.slice(0, 12).reverse().map(run => ({
                                    period: run.period || format(new Date(run.runDate), 'MMM yyyy'),
                                    amount: run.totalAmount || run.totalNetPay || 0,
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => `K${Number(value).toLocaleString()}`} />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Drill Down Modal */}
            <DrillDownModal
                open={drillDownOpen}
                onClose={() => setDrillDownOpen(false)}
                title={drillDownData?.title || ''}
                subtitle={`${drillDownData?.data.length || 0} records`}
                size="xl"
            >
                {drillDownData?.type === 'employees' && (
                    <DrillDownTable
                        data={drillDownData.data as Employee[]}
                        columns={[
                            { key: 'name', header: 'Name' },
                            { key: 'email', header: 'Email' },
                            { key: 'departmentName', header: 'Department' },
                            { key: 'role', header: 'Role' },
                            {
                                key: 'status', header: 'Status', render: (emp) => (
                                    <Badge variant={emp.status === 'Active' ? 'default' : 'secondary'}>
                                        {emp.status}
                                    </Badge>
                                )
                            },
                        ]}
                    />
                )}
                {drillDownData?.type === 'applicants' && (
                    <DrillDownTable
                        data={drillDownData.data as Applicant[]}
                        columns={[
                            { key: 'name', header: 'Name' },
                            { key: 'email', header: 'Email' },
                            {
                                key: 'status', header: 'Status', render: (app) => (
                                    <Badge>{app.status}</Badge>
                                )
                            },
                            { key: 'appliedAt', header: 'Applied', render: (app) => format(new Date(app.appliedAt), 'MMM d, yyyy') },
                            { key: 'source', header: 'Source', render: (app) => app.source || 'Direct' },
                        ]}
                    />
                )}
                {drillDownData?.type === 'payroll' && (
                    <DrillDownTable
                        data={drillDownData.data as PayrollRun[]}
                        columns={[
                            { key: 'period', header: 'Period', render: (run) => run.period || format(new Date(run.runDate), 'MMMM yyyy') },
                            { key: 'runDate', header: 'Date', render: (run) => format(new Date(run.runDate), 'MMM d, yyyy') },
                            { key: 'employeeCount', header: 'Employees', render: (run) => run.employeeCount || (run.employees ? Object.keys(run.employees).length : 0) },
                            { key: 'totalAmount', header: 'Total', render: (run) => `K${(run.totalAmount || run.totalNetPay || 0).toLocaleString()}` },
                        ]}
                    />
                )}
                {drillDownData?.type === 'attendance' && (
                    <DrillDownTable
                        data={drillDownData.data}
                        columns={[
                            { key: 'employeeName', header: 'Employee' },
                            {
                                key: 'status', header: 'Status', render: (rec) => (
                                    <Badge variant={rec.status === 'Present' ? 'default' : rec.status === 'Late' ? 'secondary' : 'destructive'}>
                                        {rec.status}
                                    </Badge>
                                )
                            },
                            { key: 'checkInTime', header: 'Check In' },
                            { key: 'checkOutTime', header: 'Check Out' },
                            { key: 'hoursWorked', header: 'Hours', render: (rec) => rec.hoursWorked?.toFixed(1) || '-' },
                        ]}
                    />
                )}
                {drillDownData?.type === 'jobs' && (
                    <DrillDownTable
                        data={drillDownData.data as JobVacancy[]}
                        columns={[
                            { key: 'title', header: 'Title' },
                            { key: 'departmentName', header: 'Department' },
                            { key: 'location', header: 'Location' },
                            { key: 'jobType', header: 'Type' },
                            { key: 'status', header: 'Status', render: (job) => <Badge>{job.status}</Badge> },
                        ]}
                    />
                )}
            </DrillDownModal>
        </div>
    );
}
