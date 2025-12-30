// src/app/dashboard/reporting/views/recruitment-reports.tsx
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
    UserPlus,
    FileText,
    Target,
    Timer,
    Receipt,
    TrendingUp,
    PieChart,
    Users,
    Download,
    Eye,
    BarChart3,
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
    FunnelChart,
    Funnel,
    LabelList,
} from 'recharts';
import { format, differenceInDays } from 'date-fns';
import type { Applicant, JobVacancy, Department } from '@/lib/data';

interface RecruitmentReportsProps {
    applicants: Applicant[];
    jobVacancies: JobVacancy[];
    departments: Department[];
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const FUNNEL_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#059669'];

export function RecruitmentReports({
    applicants,
    jobVacancies,
    departments,
    loading = false,
}: RecruitmentReportsProps) {
    const { open: openDrillDown } = useDrillDown();
    const [activeTab, setActiveTab] = React.useState('pipeline');
    const [filters, setFilters] = React.useState<Record<string, any>>({});

    const filterConfigs: FilterConfig[] = [
        commonFilters.department(departments.map(d => ({ id: d.id, name: d.name }))),
        commonFilters.dateRange(),
        commonFilters.search(),
    ];

    const handleFilterChange = (id: string, value: any) => {
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    // Calculations
    const openPositions = jobVacancies.filter(j => j.status === 'Open').length;
    const totalApplicants = applicants.length;
    const hiredCount = applicants.filter(a => a.status === 'Hired').length;

    // Average time to hire (for hired applicants)
    const avgTimeToHire = React.useMemo(() => {
        const hired = applicants.filter(a => a.status === 'Hired' && a.applicationDate);
        if (hired.length === 0) return 0;

        const totalDays = hired.reduce((sum, a) => {
            const days = differenceInDays(new Date(), new Date(a.applicationDate));
            return sum + days;
        }, 0);

        return Math.round(totalDays / hired.length);
    }, [applicants]);

    // Cost per hire (simplified estimate)
    const costPerHire = React.useMemo(() => {
        if (hiredCount === 0) return 0;
        // Estimated recruitment cost: advertising + HR time
        const estimatedCost = 5000; // Base cost per hire in ZMW
        return estimatedCost;
    }, [hiredCount]);

    // Pipeline funnel data
    const pipelineData = React.useMemo(() => {
        const stages = [
            { name: 'New', value: applicants.filter(a => a.status === 'New').length, fill: FUNNEL_COLORS[0] },
            { name: 'Screening', value: applicants.filter(a => a.status === 'Screening').length, fill: FUNNEL_COLORS[1] },
            { name: 'Interview', value: applicants.filter(a => a.status === 'Interview').length, fill: FUNNEL_COLORS[2] },
            { name: 'Offer', value: applicants.filter(a => a.status === 'Offer').length, fill: FUNNEL_COLORS[3] },
            { name: 'Hired', value: applicants.filter(a => a.status === 'Hired').length, fill: FUNNEL_COLORS[4] },
        ];
        return stages;
    }, [applicants]);

    // Source of hire
    const sourceData = React.useMemo(() => {
        const sources: Record<string, number> = {};
        applicants.forEach(app => {
            const source = app.source || 'Direct';
            sources[source] = (sources[source] || 0) + 1;
        });
        return Object.entries(sources)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [applicants]);

    // Jobs by department
    const jobsByDept = React.useMemo(() => {
        return departments.map(dept => {
            const jobs = jobVacancies.filter(j => j.departmentId === dept.id);
            const open = jobs.filter(j => j.status === 'Open').length;
            const filled = jobs.filter(j => j.status === 'Filled').length;
            return {
                name: dept.name.length > 12 ? dept.name.slice(0, 12) + '...' : dept.name,
                fullName: dept.name,
                open,
                filled,
                total: jobs.length,
            };
        }).filter(d => d.total > 0).sort((a, b) => b.open - a.open);
    }, [departments, jobVacancies]);

    // Time to hire trend
    const timeToHireTrend = React.useMemo(() => {
        // Group hired applicants by month
        const months: Record<string, { total: number; count: number }> = {};

        applicants
            .filter(a => a.status === 'Hired' && a.applicationDate)
            .forEach(a => {
                const month = format(new Date(a.applicationDate), 'MMM');
                const days = differenceInDays(new Date(), new Date(a.applicationDate));
                if (!months[month]) months[month] = { total: 0, count: 0 };
                months[month].total += days;
                months[month].count++;
            });

        return Object.entries(months).map(([month, data]) => ({
            month,
            days: Math.round(data.total / data.count),
        }));
    }, [applicants]);

    // KPIs
    const kpis = React.useMemo(() => {
        switch (activeTab) {
            case 'pipeline':
                return [
                    {
                        id: 'open-positions',
                        label: 'Open Positions',
                        value: openPositions,
                        format: 'number' as const,
                        icon: FileText,
                        color: 'blue' as const,
                    },
                    {
                        id: 'total-applicants',
                        label: 'Total Applicants',
                        value: totalApplicants,
                        format: 'number' as const,
                        icon: Users,
                        color: 'purple' as const,
                    },
                    {
                        id: 'conversion-rate',
                        label: 'Hire Rate',
                        value: totalApplicants > 0 ? (hiredCount / totalApplicants) * 100 : 0,
                        format: 'percentage' as const,
                        icon: TrendingUp,
                        color: hiredCount > 0 ? 'green' as const : 'orange' as const,
                    },
                ];
            case 'time-to-hire':
                return [
                    {
                        id: 'avg-time',
                        label: 'Avg. Time to Hire',
                        value: avgTimeToHire,
                        suffix: ' days',
                        icon: Timer,
                        color: avgTimeToHire <= 30 ? 'green' as const : 'orange' as const,
                    },
                    {
                        id: 'hired-count',
                        label: 'Total Hired',
                        value: hiredCount,
                        format: 'number' as const,
                        icon: UserPlus,
                        color: 'blue' as const,
                    },
                ];
            case 'cost':
                return [
                    {
                        id: 'cost-per-hire',
                        label: 'Avg. Cost per Hire',
                        value: costPerHire,
                        format: 'currency' as const,
                        icon: Receipt,
                        color: 'purple' as const,
                    },
                    {
                        id: 'total-hired',
                        label: 'Total Hired',
                        value: hiredCount,
                        format: 'number' as const,
                        icon: UserPlus,
                        color: 'green' as const,
                    },
                ];
            default:
                return [];
        }
    }, [activeTab, openPositions, totalApplicants, hiredCount, avgTimeToHire, costPerHire]);

    // Table columns for applicants
    const applicantColumns: Column<Applicant>[] = [
        {
            id: 'name',
            header: 'Applicant',
            accessor: 'name',
            sortable: true,
            filterable: true,
        },
        {
            id: 'position',
            header: 'Position',
            accessor: 'position',
            sortable: true,
        },
        {
            id: 'source',
            header: 'Source',
            accessor: 'source',
            render: (value) => <Badge variant="outline">{value || 'Direct'}</Badge>,
        },
        {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            sortable: true,
            render: (value) => cellRenderers.status(value,
                value === 'Hired' ? 'default' :
                    value === 'Rejected' ? 'destructive' : 'secondary'
            ),
        },
        {
            id: 'appliedDate',
            header: 'Applied',
            accessor: 'applicationDate',
            sortable: true,
            render: (value) => value ? cellRenderers.date(value) : '-',
        },
    ];

    // Job vacancy columns
    const jobColumns: Column<JobVacancy>[] = [
        {
            id: 'title',
            header: 'Job Title',
            accessor: 'title',
            sortable: true,
            filterable: true,
        },
        {
            id: 'department',
            header: 'Department',
            accessor: 'departmentName',
            sortable: true,
        },
        {
            id: 'applicants',
            header: 'Applicants',
            accessor: (row) => applicants.filter(a => a.jobId === row.id).length,
            align: 'center',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            sortable: true,
            render: (value) => cellRenderers.status(value,
                value === 'Open' ? 'default' :
                    value === 'Filled' ? 'secondary' : 'outline'
            ),
        },
        {
            id: 'posted',
            header: 'Posted',
            accessor: 'postedDate',
            sortable: true,
            render: (value) => value ? cellRenderers.date(value) : '-',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="pipeline" className="gap-2">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Pipeline</span>
                    </TabsTrigger>
                    <TabsTrigger value="source" className="gap-2">
                        <PieChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Sources</span>
                    </TabsTrigger>
                    <TabsTrigger value="time-to-hire" className="gap-2">
                        <Timer className="h-4 w-4" />
                        <span className="hidden sm:inline">Time-to-Hire</span>
                    </TabsTrigger>
                    <TabsTrigger value="cost" className="gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="hidden sm:inline">Cost</span>
                    </TabsTrigger>
                    <TabsTrigger value="jobs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Job Listings</span>
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
                <TabsContent value="pipeline" className="mt-6 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Recruitment Funnel */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Recruitment Funnel</CardTitle>
                                <CardDescription>Candidate flow through stages</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={pipelineData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Jobs by Department */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Positions by Department</CardTitle>
                                <CardDescription>Open vs filled positions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={jobsByDept}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="open" name="Open" fill="#8b5cf6" stackId="a" />
                                        <Bar dataKey="filled" name="Filled" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Applicants Table */}
                    <EnhancedDataTable
                        data={applicants}
                        columns={applicantColumns}
                        keyField="id"
                        title="All Applicants"
                        description="Complete list of candidates"
                        actions={[
                            { id: 'view', label: 'View', icon: Eye, onClick: (row) => openDrillDown('applicant', row.name, row) },
                        ]}
                    />
                </TabsContent>

                <TabsContent value="source" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Source of Hire</CardTitle>
                            <CardDescription>Where candidates come from</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <RechartsPie>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {sourceData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="time-to-hire" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Time-to-Hire Trend</CardTitle>
                            <CardDescription>Average days to hire by month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timeToHireTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => [`${value} days`, 'Avg. Time']} />
                                    <Line
                                        type="monotone"
                                        dataKey="days"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ fill: '#8b5cf6' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cost" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Recruitment Cost Analysis</CardTitle>
                            <CardDescription>Estimated cost breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[300px]">
                            <div className="text-center text-muted-foreground">
                                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Cost tracking coming soon</p>
                                <p className="text-sm">This feature requires cost data integration</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="jobs" className="mt-6">
                    <EnhancedDataTable
                        data={jobVacancies}
                        columns={jobColumns}
                        keyField="id"
                        title="Job Listings"
                        description="All job vacancies"
                        actions={[
                            { id: 'view', label: 'View', icon: Eye, onClick: (row) => openDrillDown('job', row.title, row) },
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
