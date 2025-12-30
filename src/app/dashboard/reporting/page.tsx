// src/app/dashboard/reporting/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Menu, X, Download, FileText, Calendar as CalendarIcon, FileSpreadsheet, Users, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { format } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';

// Types
import type {
    Employee,
    AuditLog,
    AttendanceRecord,
    LeaveRequest,
    RosterAssignment,
    PayrollConfig,
    Department,
    Shift,
    ResignationRequest,
    PayrollRun,
    PerformanceReview,
    Goal,
    Enrollment,
    TrainingCourse,
    Applicant,
    JobVacancy
} from '@/lib/data';

// Components
import { ReportingSidebar, ReportView } from './components/reporting-sidebar';
import { DrillDownProvider, DrillDownPanel, useDrillDown, QuickStat, DetailRow } from './components/drill-down-panel';

// Views
import { ExecutiveDashboard } from './views/executive-dashboard';
import { HRReports } from './views/hr-reports';
import { PayrollReports } from './views/payroll-reports';
import { RecruitmentReports } from './views/recruitment-reports';

// Export utils
import {
    downloadEmployeeRoster,
    downloadPayrollHistory,
    downloadAttendanceSummary,
    downloadLeaveReport,
    downloadDepartmentReport,
    downloadAuditLog,
} from '@/lib/export-utils';

function ReportingContent() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const { state: drillDownState, close: closeDrillDown, goBack } = useDrillDown();

    const [activeView, setActiveView] = useState<ReportView>('executive-dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data states
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [allAttendance, setAllAttendance] = useState<Record<string, Record<string, AttendanceRecord>>>({});
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [resignationRequests, setResignationRequests] = useState<ResignationRequest[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courses, setCourses] = useState<TrainingCourse[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([]);
    const [loading, setLoading] = useState(true);

    // Firebase data fetching
    useEffect(() => {
        if (!companyId) return;

        const refs = {
            employees: ref(db, 'employees'),
            auditLogs: ref(db, `companies/${companyId}/auditLogs`),
            attendance: ref(db, `companies/${companyId}/attendance`),
            leave: ref(db, `companies/${companyId}/leaveRequests`),
            roster: ref(db, `companies/${companyId}/rosters`),
            shifts: ref(db, `companies/${companyId}/shifts`),
            config: ref(db, `companies/${companyId}/payrollConfig`),
            departments: ref(db, `companies/${companyId}/departments`),
            resignations: ref(db, `companies/${companyId}/resignationRequests`),
            payrollRuns: ref(db, `companies/${companyId}/payrollRuns`),
            reviews: ref(db, `companies/${companyId}/performanceReviews`),
            goals: query(ref(db, 'goals'), orderByChild('companyId'), equalTo(companyId)),
            enrollments: ref(db, `companies/${companyId}/enrollments`),
            courses: ref(db, `companies/${companyId}/trainingCourses`),
            applicants: ref(db, `companies/${companyId}/applicants`),
            jobVacancies: ref(db, `companies/${companyId}/jobVacancies`),
        };

        setLoading(true);
        let loadedCount = 0;
        const totalToLoad = Object.keys(refs).length;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const onValueCallback = (setter: React.Dispatch<any>, isObject = false, filterByCompany = false) =>
            (snapshot: any) => {
                const data = snapshot.val();
                if (isObject) {
                    setter(data || {});
                } else {
                    // Use Object.keys to preserve Firebase keys as IDs
                    let list = data ? Object.keys(data).map(key => ({
                        ...data[key],
                        id: data[key].id || key, // Use existing id or Firebase key
                    })) : [];
                    if (filterByCompany) {
                        list = list.filter((item: any) => item.companyId === companyId);
                    }
                    if (setter === setAuditLogs || setter === setPayrollRuns) {
                        list.sort((a: any, b: any) =>
                            new Date(b.timestamp || b.runDate).getTime() - new Date(a.timestamp || a.runDate).getTime()
                        );
                    }
                    setter(list);
                }
                checkLoading();
            };

        const onErrorCallback = (name: string) => (error: Error) => {
            console.error(`Firebase read failed for ${name}:`, error.message);
            checkLoading();
        };

        const unsubscribes = [
            onValue(query(refs.employees, orderByChild('companyId'), equalTo(companyId)),
                onValueCallback(setEmployees), onErrorCallback('employees')),
            onValue(refs.auditLogs, onValueCallback(setAuditLogs), onErrorCallback('audit logs')),
            onValue(refs.attendance, onValueCallback(setAllAttendance, true), onErrorCallback('attendance')),
            onValue(refs.leave, onValueCallback(setLeaveRequests), onErrorCallback('leave')),
            onValue(refs.roster, (snapshot) => {
                const data = snapshot.val();
                const assignments: RosterAssignment[] = [];
                if (data) {
                    Object.keys(data).forEach(date => {
                        Object.keys(data[date]).forEach(employeeId => {
                            assignments.push({
                                id: `${date}-${employeeId}`,
                                ...data[date][employeeId],
                            });
                        });
                    });
                }
                setRosterAssignments(assignments);
                checkLoading();
            }, onErrorCallback('roster')),
            onValue(refs.shifts, onValueCallback(setShifts), onErrorCallback('shifts')),
            onValue(refs.config, onValueCallback(setPayrollConfig, true), onErrorCallback('config')),
            onValue(refs.departments, onValueCallback(setDepartments), onErrorCallback('departments')),
            onValue(refs.resignations, onValueCallback(setResignationRequests), onErrorCallback('resignations')),
            onValue(refs.payrollRuns, onValueCallback(setPayrollRuns), onErrorCallback('payroll runs')),
            onValue(refs.reviews, onValueCallback(setPerformanceReviews), onErrorCallback('reviews')),
            onValue(refs.goals, onValueCallback(setGoals), onErrorCallback('goals')),
            onValue(refs.enrollments, onValueCallback(setEnrollments), onErrorCallback('enrollments')),
            onValue(refs.courses, onValueCallback(setCourses), onErrorCallback('courses')),
            onValue(refs.applicants, onValueCallback(setApplicants), onErrorCallback('applicants')),
            onValue(refs.jobVacancies, onValueCallback(setJobVacancies), onErrorCallback('jobVacancies')),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, [companyId]);

    // Handle view navigation
    const handleViewChange = useCallback((view: ReportView) => {
        setActiveView(view);
        setMobileMenuOpen(false);
    }, []);

    // Handle exports based on current view
    const handleExport = useCallback((type: 'employees' | 'payroll' | 'attendance' | 'leave' | 'departments' | 'all') => {
        try {
            switch (type) {
                case 'employees':
                    downloadEmployeeRoster(employees);
                    toast({ title: 'Export Complete', description: 'Employee roster downloaded successfully.' });
                    break;
                case 'payroll':
                    downloadPayrollHistory(payrollRuns);
                    toast({ title: 'Export Complete', description: 'Payroll history downloaded successfully.' });
                    break;
                case 'attendance':
                    downloadAttendanceSummary(employees, allAttendance);
                    toast({ title: 'Export Complete', description: 'Attendance summary downloaded successfully.' });
                    break;
                case 'leave':
                    downloadLeaveReport(leaveRequests, employees);
                    toast({ title: 'Export Complete', description: 'Leave report downloaded successfully.' });
                    break;
                case 'departments':
                    downloadDepartmentReport(departments, employees, payrollConfig);
                    toast({ title: 'Export Complete', description: 'Department report downloaded successfully.' });
                    break;
                case 'all':
                    // Export all based on current view context
                    downloadEmployeeRoster(employees);
                    toast({ title: 'Export Complete', description: 'Report downloaded successfully.' });
                    break;
            }
        } catch (error) {
            toast({ title: 'Export Failed', description: 'There was an error generating the export.', variant: 'destructive' });
        }
    }, [employees, payrollRuns, allAttendance, leaveRequests, departments, payrollConfig, toast]);

    // Get view title
    const getViewTitle = () => {
        const titles: Record<ReportView, string> = {
            'executive-dashboard': 'Executive Dashboard',
            'hr-manager-dashboard': 'HR Manager Dashboard',
            'finance-dashboard': 'Finance Dashboard',
            'custom-dashboard': 'Custom Dashboard',
            'job-requisitions': 'Job Requisitions',
            'candidate-pipeline': 'Candidate Pipeline',
            'source-of-hire': 'Source of Hire',
            'time-to-hire': 'Time-to-Hire Analysis',
            'cost-per-hire': 'Cost per Hire',
            'employee-master': 'Employee Master',
            'headcount': 'Headcount Report',
            'attendance-leave': 'Attendance & Leave',
            'performance': 'Performance Report',
            'turnover-attrition': 'Turnover & Attrition',
            'payroll-summary': 'Payroll Summary',
            'tax-compliance': 'Tax & Compliance',
            'benefits-compensation': 'Benefits & Compensation',
            'overtime-allowances': 'Overtime & Allowances',
            'saved-reports': 'Saved Reports',
        };
        return titles[activeView] || 'Reports';
    };

    // Render active view
    const renderView = () => {
        const dashboardViews = ['executive-dashboard', 'hr-manager-dashboard', 'finance-dashboard', 'custom-dashboard'];
        const recruitmentViews = ['job-requisitions', 'candidate-pipeline', 'source-of-hire', 'time-to-hire', 'cost-per-hire'];
        const hrViews = ['employee-master', 'headcount', 'attendance-leave', 'performance', 'turnover-attrition'];
        const payrollViews = ['payroll-summary', 'tax-compliance', 'benefits-compensation', 'overtime-allowances'];

        if (dashboardViews.includes(activeView)) {
            return (
                <ExecutiveDashboard
                    employees={employees}
                    departments={departments}
                    payrollRuns={payrollRuns}
                    leaveRequests={leaveRequests}
                    applicants={applicants}
                    jobVacancies={jobVacancies}
                    performanceReviews={performanceReviews}
                    loading={loading}
                />
            );
        }

        if (recruitmentViews.includes(activeView)) {
            return (
                <RecruitmentReports
                    applicants={applicants}
                    jobVacancies={jobVacancies}
                    departments={departments}
                    loading={loading}
                />
            );
        }

        if (hrViews.includes(activeView)) {
            return (
                <HRReports
                    employees={employees}
                    departments={departments}
                    allAttendance={allAttendance}
                    leaveRequests={leaveRequests}
                    performanceReviews={performanceReviews}
                    resignationRequests={resignationRequests}
                    loading={loading}
                />
            );
        }

        if (payrollViews.includes(activeView)) {
            return (
                <PayrollReports
                    employees={employees}
                    departments={departments}
                    payrollRuns={payrollRuns}
                    payrollConfig={payrollConfig}
                    loading={loading}
                />
            );
        }

        // Saved Reports placeholder
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Saved Reports</p>
                    <p className="text-sm">Save custom report configurations for quick access</p>
                </div>
            </div>
        );
    };

    // Render drill-down content
    const renderDrillDownContent = () => {
        const { type, data } = drillDownState;

        if (!data) return null;

        switch (type) {
            case 'employees':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <QuickStat label="Active" value={data.employees?.filter((e: Employee) => e.status === 'Active').length || 0} />
                            <QuickStat label="Inactive" value={data.employees?.filter((e: Employee) => e.status !== 'Active').length || 0} />
                        </div>
                        <div className="space-y-2">
                            {data.employees?.slice(0, 10).map((emp: Employee) => (
                                <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium text-sm">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                                    </div>
                                    <span className="text-xs">{emp.departmentName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'employee':
                return (
                    <div className="space-y-4">
                        <DetailRow label="Name" value={data.name} />
                        <DetailRow label="Email" value={data.email} />
                        <DetailRow label="Role" value={data.role} />
                        <DetailRow label="Department" value={data.departmentName} />
                        <DetailRow label="Status" value={data.status} />
                        <DetailRow label="Hire Date" value={data.hireDate ? format(new Date(data.hireDate), 'PP') : '-'} />
                    </div>
                );

            case 'payroll':
                return (
                    <div className="space-y-4">
                        <QuickStat
                            label="Latest Run"
                            value={data.payrollRuns?.[0] ? format(new Date(data.payrollRuns[0].runDate), 'MMMM yyyy') : 'N/A'}
                        />
                        {data.payrollRuns?.slice(0, 5).map((run: PayrollRun) => (
                            <div key={run.id} className="p-4 border rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-sm">{format(new Date(run.runDate), 'MMMM yyyy')}</h4>
                                        <p className="text-xs text-muted-foreground">{format(new Date(run.runDate), 'MMM d, yyyy')}</p>
                                    </div>
                                    <Badge variant="outline">{Object.keys(run.employees || {}).length} employees</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                                    <span className="text-muted-foreground">Gross:</span>
                                    <span>K {(Object.values(run.employees || {}).reduce((acc, curr) => acc + (curr.grossPay || 0), 0)).toLocaleString()}</span>
                                    <span className="text-muted-foreground">Net:</span>
                                    <span>K {(Object.values(run.employees || {}).reduce((acc, curr) => acc + (curr.netPay || 0), 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return (
                    <div className="text-muted-foreground text-center py-8">
                        <p>No details available</p>
                    </div>
                );
        }
    };

    // Debug logging
    console.log('[Reporting] Data loaded:', {
        companyId,
        loading,
        employees: employees.length,
        departments: departments.length,
        payrollRuns: payrollRuns.length,
        applicants: applicants.length,
    });

    return (
        <>
            <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-6">
                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-20 left-4 z-50 lg:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Sidebar - Mobile */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={cn(
                    "fixed lg:relative z-40 h-full transition-transform duration-300",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}>
                    <ReportingSidebar
                        activeView={activeView}
                        onViewChange={handleViewChange}
                        collapsed={sidebarCollapsed}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="ml-10 lg:ml-0">
                                <h1 className="text-2xl font-bold">{getViewTitle()}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            <span className="hidden sm:inline">Export</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => handleExport('employees')}>
                                            <Users className="mr-2 h-4 w-4" />
                                            Employee Roster
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('payroll')}>
                                            <Receipt className="mr-2 h-4 w-4" />
                                            Payroll History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('attendance')}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Attendance Summary
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('leave')}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Leave Report
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('departments')}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Department Report
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                    <p className="text-muted-foreground">Loading reports...</p>
                                </div>
                            </div>
                        ) : (
                            renderView()
                        )}
                    </div>
                </div>

                {/* Drill-Down Panel */}
                <DrillDownPanel
                    isOpen={drillDownState.isOpen}
                    onClose={closeDrillDown}
                    title={drillDownState.title}
                    subtitle={drillDownState.subtitle}
                    breadcrumbs={drillDownState.breadcrumbs}
                    onBreadcrumbClick={(_, index) => {
                        if (index < drillDownState.breadcrumbs.length - 1) {
                            goBack();
                        }
                    }}
                    showExport
                >
                    {renderDrillDownContent()}
                </DrillDownPanel>
            </div>
        </>
    );
}

export default function ReportingPage() {
    return (
        <DrillDownProvider>
            <ReportingContent />
        </DrillDownProvider>
    );
}
