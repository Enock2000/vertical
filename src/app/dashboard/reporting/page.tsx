// src/app/dashboard/reporting/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { File, Loader2, Download, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadcountChart from "./components/headcount-chart";
import TurnoverChart from "./components/turnover-chart";
import DepartmentHeadcountChart from "./components/department-headcount-chart";
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Employee, AuditLog, AttendanceRecord, LeaveRequest, RosterAssignment, PayrollConfig, Department, Shift, ResignationRequest, PayrollRun, PerformanceReview, DepartmentProductivityScore, Goal } from '@/lib/data';
import { format, isWithinInterval } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RosterCalendar } from '../roster/components/roster-calendar';
import { DataTable } from './components/attendance-data-table';
import { columns } from './components/attendance-columns';
import { recordAttendance } from '@/ai/flows/attendance-flow';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import DepartmentDistributionChart from './components/department-distribution-chart';
import ActiveContractsChart from './components/active-contracts-chart';
import EmployeeStatusChart from './components/employee-status-chart';
import AttendancePerformanceChart from './components/attendance-performance-chart';
import TotalPayrollChart from './components/total-payroll-chart';
import PayrollByDepartmentChart from './components/payroll-by-department-chart';
import AverageSalaryChart from './components/average-salary-chart';
import PerformanceRatingChart from './components/performance-rating-chart';
import AverageProductivityChart from './components/average-productivity-chart';
import { calculateProductivityScore } from '@/lib/data';
import TopPerformersChart from './components/top-performers-chart';

const availableReports = [
    { name: 'Employee Roster', description: 'A full list of all active and inactive employees.' },
    { name: 'Payroll History', description: 'A detailed history of all payroll runs.' },
    { name: 'Attendance Summary', description: 'A summary of employee attendance for a selected period.' },
    { name: 'Daily Attendance Status', description: 'Daily breakdown of employees who are Present, Absent, or On Leave.' },
    { name: 'Leave Report', description: 'Details on employees on leave and sick notes submitted.' },
    { name: 'Leave Balances', description: 'Current leave balances for all employees.' },
    { name: 'Department Report', description: 'A list of all departments and the employees within them.' },
    { name: 'Roles Report', description: 'A list of all roles and their assigned permissions.' },
    { name: 'Emergency Alerts', description: 'A log of all triggered emergency alerts.' },
];

export default function ReportingPage() {
    const { companyId } = useAuth();
    const { toast } = useToast();
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
    const [goals, setGoals] = useState<Goal[]>([]); // Add goals state
    const [loading, setLoading] = useState(true);
    const [submittingIds, setSubmittingIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
            goals: ref(db, `goals`), // Goals are not under companyId
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

        const onValueCallback = (setter: React.Dispatch<any>, isObject = false, filterByCompany = false) => (snapshot: any) => {
            const data = snapshot.val();
            if (isObject) {
                 setter(data || {});
            } else {
                 let list = data ? Object.values(data) : [];
                 if (filterByCompany) {
                     list = list.filter((item: any) => item.companyId === companyId);
                 }
                 if (setter === setAuditLogs || setter === setPayrollRuns) {
                    list.sort((a: any, b: any) => new Date(b.timestamp || b.runDate).getTime() - new Date(a.timestamp || a.runDate).getTime());
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
            onValue(query(refs.employees, orderByChild('companyId'), equalTo(companyId)), onValueCallback(setEmployees), onErrorCallback('employees')),
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
            onValue(refs.reviews, onValueCallback(setPerformanceReviews, false, true), onErrorCallback('reviews')),
            onValue(query(refs.goals, orderByChild('companyId'), equalTo(companyId)), onValueCallback(setGoals), onErrorCallback('goals')),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, [companyId]);
    
    const attendanceRecords = useMemo(() => allAttendance[selectedDateString] || {}, [allAttendance, selectedDateString]);

    const productivityScores = useMemo(() => {
        return calculateProductivityScore(employees, departments, allAttendance, performanceReviews, goals, payrollConfig);
    }, [employees, departments, allAttendance, performanceReviews, goals, payrollConfig]);

    const dailyStatusReport = useMemo(() => {
    return employees
        .filter(emp => emp.status === 'Active' || emp.status === 'Suspended' || emp.status === 'Sick')
        .map(emp => {
            const attendanceRecord = attendanceRecords[emp.id];
            const onLeave = leaveRequests.find(req => 
                req.employeeId === emp.id && 
                req.status === 'Approved' &&
                isWithinInterval(selectedDate, { start: new Date(req.startDate), end: new Date(req.endDate) })
            );

            let status: string;
            
            if (emp.status === 'Suspended') {
                status = 'Suspended';
            } else if (emp.status === 'Sick') {
                status = 'Sick';
            } else if (onLeave) {
                status = 'On Leave';
            } else if (attendanceRecord) {
                status = attendanceRecord.status;
            } else {
                status = 'Absent';
            }

            return {
                ...emp,
                dailyStatus: status,
            };
        });
    }, [employees, attendanceRecords, leaveRequests, selectedDate]);
    
    const handleClockAction = useCallback(async (employeeId: string, action: 'clockIn' | 'clockOut') => {
        if (!companyId) return;
        setSubmittingIds(prev => [...prev, employeeId]);
        try {
            const result = await recordAttendance({ userId: employeeId, action, companyId });
            if (result.success) {
                toast({ title: `Successfully ${action === 'clockIn' ? 'Clocked In' : 'Clocked Out'}` });
            } else {
                toast({ variant: "destructive", title: "Action Failed", description: result.message });
            }
        } catch (error: any) {
            console.error(`${action} error:`, error);
            toast({ variant: "destructive", title: "Error", description: `An unexpected error occurred during ${action}.` });
        } finally {
            setSubmittingIds(prev => prev.filter(id => id !== employeeId));
        }
    }, [companyId, toast]);
    
    const enrichedAttendanceRecords = useMemo(() => {
        const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDateString;
        return employees
            .filter(e => e.status === 'Active')
            .map(employee => {
                const record = attendanceRecords[employee.id];
                return {
                    ...record,
                    id: employee.id, // Use employee ID as the key for the row
                    employeeId: employee.id,
                    employeeName: employee.name,
                    role: employee.role,
                    departmentName: employee.departmentName,
                    avatar: employee.avatar,
                    email: employee.email,
                    dailyTargetHours: payrollConfig?.dailyTargetHours,
                    onClockIn: () => handleClockAction(employee.id, 'clockIn'),
                    onClockOut: () => handleClockAction(employee.id, 'clockOut'),
                    isSubmitting: submittingIds.includes(employee.id),
                    checkInTime: record?.checkInTime, // Ensure these are passed
                    checkOutTime: record?.checkOutTime,
                    status: isToday ? (record?.status || 'Not Clocked In') : (record?.status || 'N/A'),
                    currentTime: isToday ? currentTime : undefined,
                    date: selectedDateString,
                };
        });
    }, [attendanceRecords, employees, payrollConfig, handleClockAction, submittingIds, selectedDateString, currentTime]);


    return (
        <Tabs defaultValue="overview">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                    <TabsTrigger value="daily-status">Daily Status</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                 <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                        Export
                    </span>
                </Button>
            </div>
             <TabsContent value="overview" className="space-y-4 pt-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Headcount</CardTitle>
                                <CardDescription>Total number of active employees over time.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <HeadcountChart employees={employees} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Attendance Performance</CardTitle>
                                <CardDescription>Overview of daily attendance metrics over time.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AttendancePerformanceChart allAttendance={allAttendance} payrollConfig={payrollConfig} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Turnover Rate</CardTitle>
                                 <CardDescription>Employee turnover analysis for the current year.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TurnoverChart employees={employees} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Department Headcount</CardTitle>
                                <CardDescription>Employee count by department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <DepartmentHeadcountChart employees={employees} departments={departments} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Department Distribution</CardTitle>
                                <CardDescription>Employee distribution across departments.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <DepartmentDistributionChart employees={employees} departments={departments} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Active Contracts</CardTitle>
                                <CardDescription>Breakdown of active employee contracts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <ActiveContractsChart employees={employees} />
                            </CardContent>
                        </Card>
                         <Card>
                             <CardHeader>
                                <CardTitle>Employee Status</CardTitle>
                                <CardDescription>Current status of employees.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <EmployeeStatusChart employees={employees} leaveRequests={leaveRequests} resignationRequests={resignationRequests} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Total Payroll Cost</CardTitle>
                                <CardDescription>Monthly payroll cost trend.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <TotalPayrollChart payrollRuns={payrollRuns} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Payroll Cost by Department</CardTitle>
                                <CardDescription>Estimated current payroll cost per department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <PayrollByDepartmentChart employees={employees} departments={departments} payrollConfig={payrollConfig} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Average Salary by Department</CardTitle>
                                <CardDescription>Average salary for active employees per department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <AverageSalaryChart employees={employees} departments={departments} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Performance Rating Distribution</CardTitle>
                                <CardDescription>Distribution of employee performance ratings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <PerformanceRatingChart reviews={performanceReviews} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Average Productivity Score</CardTitle>
                                <CardDescription>Productivity scores by department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <AverageProductivityChart scores={productivityScores} />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Top Performers Trend</CardTitle>
                                <CardDescription>Quarterly count of top-rated employees.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <TopPerformersChart reviews={performanceReviews} />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>
             <TabsContent value="attendance">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>
                            Daily attendance records for {format(selectedDate, 'MMMM d, yyyy')}. Admins can manually clock employees in or out on the current day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end mb-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <DataTable columns={columns} data={enrichedAttendanceRecords} />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="roster">
                 <Card>
                    <CardHeader>
                        <CardTitle>Employee Roster</CardTitle>
                        <CardDescription>
                            Manage and view employee schedules, including work days, off days, and approved leave.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <RosterCalendar
                                employees={employees}
                                leaveRequests={leaveRequests}
                                rosterAssignments={rosterAssignments}
                                shifts={shifts}
                            />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="daily-status">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Daily Attendance Status</CardTitle>
                            <CardDescription>Breakdown of employees who are Present, Absent, or On Leave for {format(selectedDate, 'MMMM d, yyyy')}.</CardDescription>
                        </div>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : dailyStatusReport.length > 0 ? (
                                    dailyStatusReport.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={emp.avatar} alt={emp.name} />
                                                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {emp.name}
                                            </TableCell>
                                            <TableCell>{emp.departmentName}</TableCell>
                                            <TableCell>{emp.role}</TableCell>
                                            <TableCell>
                                                 <Badge variant={
                                                     emp.dailyStatus === 'Present' || emp.dailyStatus === 'Auto Clock-out' || emp.dailyStatus === 'Late' || emp.dailyStatus === 'Early Out' ? 'default' :
                                                     emp.dailyStatus === 'Absent' || emp.dailyStatus === 'Suspended' ? 'destructive' :
                                                     emp.dailyStatus === 'Sick' ? 'secondary' :
                                                     'outline'
                                                 }>
                                                    {emp.dailyStatus}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No employees to report on.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="reports">
                <Card>
                    <CardHeader>
                        <CardTitle>Exportable Reports</CardTitle>
                        <CardDescription>Download various reports in CSV or PDF format.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Report Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableReports.map((report) => (
                                    <TableRow key={report.name}>
                                        <TableCell className="font-medium">{report.name}</TableCell>
                                        <TableCell>{report.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" disabled>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="audit">
                 <Card>
                    <CardHeader>
                        <CardTitle>Audit Log</CardTitle>
                        <CardDescription>A log of all significant activities within the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(new Date(log.timestamp), 'MMM d, yyyy - hh:mm:ss a')}</TableCell>
                                            <TableCell>{log.actor}</TableCell>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell>{log.details}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
