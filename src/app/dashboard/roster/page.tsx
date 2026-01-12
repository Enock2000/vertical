// src/app/dashboard/roster/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth-provider';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterCalendar } from './components/roster-calendar';
import { DailyAttendanceDashboard } from '../reporting/views/daily-attendance';
import type { Employee, LeaveRequest, RosterAssignment, Shift, AttendanceRecord, ShiftSwapRequest, ConditionReport } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { update, ref as dbRef } from 'firebase/database';
import { Check, X, ArrowLeftRight, AlertCircle, ThermometerSun, Home, Clock, LogOut, Siren, Paperclip } from 'lucide-react';

export default function RosterPage() {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
    const [conditionReports, setConditionReports] = useState<ConditionReport[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (!companyId) return;

        let loadedCount = 0;
        const totalToLoad = 7;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount >= totalToLoad) {
                setLoading(false);
            }
        };

        // Employees
        const employeesRef = query(ref(db, 'employees'), orderByChild('companyId'), equalTo(companyId));
        const employeesUnsub = onValue(employeesRef, snapshot => {
            const data = snapshot.val();
            const list = data ? Object.values<Employee>(data).filter(e => e.status === 'Active' && e.id !== companyId) : [];
            setEmployees(list);
            checkLoading();
        });

        // Leave Requests
        const leaveRef = ref(db, `companies/${companyId}/leaveRequests`);
        const leaveUnsub = onValue(leaveRef, snapshot => {
            const data = snapshot.val();
            const list = data ? Object.values<LeaveRequest>(data) : [];
            setLeaveRequests(list);
            checkLoading();
        });

        // Roster Assignments
        const rosterRef = ref(db, `companies/${companyId}/rosters`);
        const rosterUnsub = onValue(rosterRef, snapshot => {
            const data = snapshot.val();
            const list: RosterAssignment[] = [];
            if (data) {
                // Data structure is: rosters/{date}/{employeeId} = Assignment
                Object.keys(data).forEach(date => {
                    if (data[date]) {
                        Object.keys(data[date]).forEach(empId => {
                            const assignment = data[date][empId];
                            if (assignment) {
                                list.push({
                                    ...assignment,
                                    id: `${date}-${empId}`, // Generate a unique ID if needed
                                    date: date, // Ensure date is present
                                    employeeId: empId // Ensure employeeId is present
                                });
                            }
                        });
                    }
                });
            }
            setRosterAssignments(list);
            checkLoading();
        });

        // Shifts
        const shiftsRef = ref(db, `companies/${companyId}/shifts`);
        const shiftsUnsub = onValue(shiftsRef, snapshot => {
            const data = snapshot.val();
            const list = data ? Object.values<Shift>(data) : [];
            setShifts(list);
            checkLoading();
        });

        // Today's Attendance
        const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}`);
        const attendanceUnsub = onValue(attendanceRef, snapshot => {
            const data = snapshot.val();
            setTodayAttendance(data || {});
            checkLoading();
        });

        // Shift Swap Requests
        const swapRef = ref(db, `companies/${companyId}/shiftSwapRequests`);
        const swapUnsub = onValue(swapRef, snapshot => {
            const data = snapshot.val();
            const list: ShiftSwapRequest[] = data ? Object.values(data) : [];
            setSwapRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            checkLoading();
        });

        // Condition Reports
        const conditionsRef = ref(db, `companies/${companyId}/conditionReports`);
        const conditionsUnsub = onValue(conditionsRef, snapshot => {
            const data = snapshot.val();
            const list: ConditionReport[] = data ? Object.values(data) : [];
            setConditionReports(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            checkLoading();
        });

        return () => {
            employeesUnsub();
            leaveUnsub();
            rosterUnsub();
            shiftsUnsub();
            attendanceUnsub();
            swapUnsub();
            conditionsUnsub();
        };
    }, [companyId, todayString]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const pendingSwapRequests = swapRequests.filter(r => r.status === 'Pending');
    const pendingConditions = conditionReports.filter(r => r.status === 'Pending');
    const todayConditions = conditionReports.filter(r => r.date === todayString);

    const getConditionIcon = (type: ConditionReport['type']) => {
        switch (type) {
            case 'Sick': return <ThermometerSun className="h-4 w-4 text-red-500" />;
            case 'WFH': return <Home className="h-4 w-4 text-blue-500" />;
            case 'Late': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'EarlyDeparture': return <LogOut className="h-4 w-4 text-orange-500" />;
            case 'Emergency': return <Siren className="h-4 w-4 text-red-600" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getConditionLabel = (type: ConditionReport['type']) => {
        switch (type) {
            case 'Sick': return 'Sick';
            case 'WFH': return 'Working from Home';
            case 'Late': return 'Late Arrival';
            case 'EarlyDeparture': return 'Early Departure';
            case 'Emergency': return 'Emergency';
            default: return type;
        }
    };

    const handleSwapAction = async (request: ShiftSwapRequest, action: 'Approved' | 'Rejected') => {
        try {
            await update(dbRef(db, `companies/${companyId}/shiftSwapRequests/${request.id}`), {
                status: action,
                reviewedAt: new Date().toISOString(),
            });
            toast({
                title: `Request ${action}`,
                description: `Shift swap request from ${request.requesterName} has been ${action.toLowerCase()}.`,
            });
        } catch (error) {
            console.error('Error updating swap request:', error);
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: 'Could not update the request. Please try again.',
            });
        }
    };

    const handleConditionAction = async (report: ConditionReport, action: 'Acknowledged' | 'Rejected') => {
        try {
            await update(dbRef(db, `companies/${companyId}/conditionReports/${report.id}`), {
                status: action,
                acknowledgedAt: new Date().toISOString(),
            });
            toast({
                title: `Condition ${action}`,
                description: `${report.employeeName}'s condition report has been ${action.toLowerCase()}.`,
            });
        } catch (error) {
            console.error('Error updating condition report:', error);
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: 'Could not update the report. Please try again.',
            });
        }
    };

    return (
        <Tabs defaultValue="attendance">
            <TabsList className="mb-4">
                <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
                <TabsTrigger value="roster">Roster Calendar</TabsTrigger>
                <TabsTrigger value="swaps" className="relative">
                    Swap Requests
                    {pendingSwapRequests.length > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5">{pendingSwapRequests.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="conditions" className="relative">
                    Condition Reports
                    {pendingConditions.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">{pendingConditions.length}</Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="attendance">
                <DailyAttendanceDashboard
                    employees={employees}
                    todayAttendance={todayAttendance}
                    date={new Date()}
                />
            </TabsContent>
            <TabsContent value="roster">
                <RosterCalendar
                    employees={employees}
                    leaveRequests={leaveRequests}
                    rosterAssignments={rosterAssignments}
                    shifts={shifts}
                />
            </TabsContent>
            <TabsContent value="swaps">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            Shift Swap Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingSwapRequests.length > 0 ? (
                            <div className="space-y-3">
                                {pendingSwapRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{request.requesterName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.date} • {request.shiftName}
                                            </p>
                                            <p className="text-sm mt-1 italic">"{request.reason}"</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleSwapAction(request, 'Rejected')}>
                                                <X className="mr-1 h-4 w-4" /> Reject
                                            </Button>
                                            <Button size="sm" onClick={() => handleSwapAction(request, 'Approved')}>
                                                <Check className="mr-1 h-4 w-4" /> Approve
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending swap requests.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="conditions">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Employee Condition Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayConditions.length > 0 ? (
                            <div className="space-y-3">
                                {todayConditions.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getConditionIcon(report.type)}
                                            <div>
                                                <p className="font-medium">{report.employeeName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {getConditionLabel(report.type)}
                                                    {report.estimatedArrivalTime && ` • ETA: ${report.estimatedArrivalTime}`}
                                                    {report.departureTime && ` • Leaving: ${report.departureTime}`}
                                                </p>
                                                {report.reason && (
                                                    <p className="text-sm mt-1 italic">"{report.reason}"</p>
                                                )}
                                                {report.attachmentUrl && (
                                                    <a
                                                        href={report.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                                                    >
                                                        <Paperclip className="h-3 w-3" />
                                                        View Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={report.status === 'Pending' ? 'secondary' : report.status === 'Acknowledged' ? 'default' : 'destructive'}>
                                                {report.status}
                                            </Badge>
                                            {report.status === 'Pending' && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => handleConditionAction(report, 'Rejected')}>
                                                        <X className="mr-1 h-4 w-4" /> Reject
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleConditionAction(report, 'Acknowledged')}>
                                                        <Check className="mr-1 h-4 w-4" /> Acknowledge
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No condition reports for today.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
