
// src/app/dashboard/reporting/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { File, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadcountChart from "./components/headcount-chart";
import TurnoverChart from "./components/turnover-chart";
import DiversityChart from "./components/diversity-chart";
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { Employee, AuditLog, AttendanceRecord, LeaveRequest, RosterAssignment } from '@/lib/data';
import { format, isWithinInterval } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RosterCalendar } from '../roster/components/roster-calendar';

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
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const auditLogsRef = ref(db, `companies/${companyId}/auditLogs`);
        const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}`);
        const leaveRef = ref(db, `companies/${companyId}/leaveRequests`);
        const rosterRef = ref(db, `companies/${companyId}/rosters`);
        
        let loadedCount = 0;
        const totalToLoad = 5;
        
        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const onValueCallback = (setter: React.Dispatch<any>, isObject = false) => (snapshot: any) => {
            const data = snapshot.val();
            if (isObject) {
                 setter(data || {});
            } else {
                 const list = data ? Object.values(data) : [];
                 if (setter === setAuditLogs) {
                    list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                 }
                setter(list);
            }
            checkLoading();
        };

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            setEmployees(data ? Object.values<Employee>(data).filter(e => e.companyId === companyId) : []);
            checkLoading();
        });
        const auditLogsUnsubscribe = onValue(auditLogsRef, onValueCallback(setAuditLogs), (err) => {console.error(err); checkLoading()});
        const attendanceUnsubscribe = onValue(attendanceRef, onValueCallback(setTodayAttendance, true), (err) => {console.error(err); checkLoading()});
        const leaveUnsubscribe = onValue(leaveRef, onValueCallback(setLeaveRequests), (err) => {console.error(err); checkLoading()});
        const rosterUnsubscribe = onValue(rosterRef, (snapshot) => {
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
        }, (err) => {console.error(err); checkLoading()});


        return () => {
            employeesUnsubscribe();
            auditLogsUnsubscribe();
            attendanceUnsubscribe();
            leaveUnsubscribe();
            rosterUnsubscribe();
        };
    }, [companyId, todayString]);
    
    const dailyStatusReport = useMemo(() => {
        return employees.map(emp => {
            const attendanceRecord = todayAttendance[emp.id];
            const onLeave = leaveRequests.find(req => 
                req.employeeId === emp.id && 
                req.status === 'Approved' &&
                isWithinInterval(today, { start: new Date(req.startDate), end: new Date(req.endDate) })
            );

            let status: string;
            if (onLeave) {
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
    }, [employees, todayAttendance, leaveRequests, today]);

    return (
        <Tabs defaultValue="overview">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                    <TabsTrigger value="daily-status">Daily Status</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                 <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                    </span>
                </Button>
            </div>
             <TabsContent value="overview" className="space-y-4">
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
                                <CardTitle>Turnover Rate</CardTitle>
                                 <CardDescription>Employee turnover analysis for the current year.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TurnoverChart employees={employees} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Diversity Dashboard</CardTitle>
                                <CardDescription>Breakdown of workforce by gender.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <DiversityChart employees={employees} />
                            </CardContent>
                        </Card>
                    </div>
                )}
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
                            />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="daily-status">
                 <Card>
                    <CardHeader>
                        <CardTitle>Daily Attendance Status</CardTitle>
                        <CardDescription>Breakdown of employees who are Present, Absent, or On Leave for {format(today, 'MMMM d, yyyy')}.</CardDescription>
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
                                                     emp.dailyStatus === 'Present' || emp.dailyStatus === 'Auto Clock-out' ? 'default' :
                                                     emp.dailyStatus === 'Absent' ? 'destructive' :
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
