
// src/app/employee-portal/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onValue, query, orderByChild, equalTo, update } from 'firebase/database';
import { format, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import type { Employee, AttendanceRecord, PayrollConfig, LeaveRequest, Announcement, RosterAssignment } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { recordAttendance } from '@/ai/flows/attendance-flow';
import { reportEmergency } from '@/ai/flows/report-emergency-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    LogIn,
    LogOut,
    CalendarPlus,
    Receipt,
    ShieldAlert,
    CalendarDays,
    LogOutIcon,
    Coffee,
    Play,
    Clock,
    Timer
} from "lucide-react";
import { EmployeeLeaveRequestDialog } from './components/employee-leave-request-dialog';
import { EmployeePayslipDialog } from './components/employee-payslip-dialog';
import { SubmitResignationDialog } from './components/submit-resignation-dialog';
import { ShiftSwapRequestDialog } from './components/shift-swap-request-dialog';
import { ReportConditionDialog } from './components/report-condition-dialog';
import { CalendarClock, ArrowLeftRight, AlertCircle } from 'lucide-react';
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
import { useAuth } from '../auth-provider';
import { cn } from '@/lib/utils';


export default function EmployeePortalDashboardPage() {
    const { user, employee, companyId, company, loading: loadingAuth } = useAuth();
    const router = useRouter();
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [upcomingRoster, setUpcomingRoster] = useState<RosterAssignment[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState<string | null>(null);
    const [isReportingEmergency, setIsReportingEmergency] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { toast } = useToast();

    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!loadingAuth && !user) {
            router.push('/employee-login');
        }
    }, [user, loadingAuth, router]);

    useEffect(() => {
        if (user && companyId) {
            let loadedCount = 0;
            const totalToLoad = 5;

            const checkLoading = () => {
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    setLoadingData(false);
                }
            }

            const createSingleItemCallback = (setter: React.Dispatch<any>) => {
                return (snapshot: any) => {
                    setter(snapshot.val());
                    checkLoading();
                };
            };

            const createListCallback = (setter: React.Dispatch<any>) => {
                return (snapshot: any) => {
                    const data = snapshot.val();
                    const list = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
                    setter(list);
                    checkLoading();
                }
            }

            const onErrorCallback = (name: string) => (error: Error) => {
                console.error(`Firebase read failed (${name}):`, error);
                checkLoading();
            };

            const todayAttendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}/${user.uid}`);
            const todayAttendanceUnsubscribe = onValue(todayAttendanceRef, createSingleItemCallback(setTodayAttendance), onErrorCallback('today attendance'));

            const payrollConfigRef = ref(db, `companies/${companyId}/payrollConfig`);
            const payrollConfigUnsubscribe = onValue(payrollConfigRef, createSingleItemCallback(setPayrollConfig), onErrorCallback('payroll config'));

            const leaveRequestsQuery = query(ref(db, `companies/${companyId}/leaveRequests`), orderByChild('employeeId'), equalTo(user.uid));
            const leaveRequestsUnsubscribe = onValue(leaveRequestsQuery, createListCallback(setLeaveRequests), onErrorCallback('leave requests'));

            const announcementsRef = ref(db, `companies/${companyId}/announcements`);
            const announcementsUnsubscribe = onValue(announcementsRef, (snapshot) => {
                const data = snapshot.val();
                const allAnnouncements: Announcement[] = data ? Object.values(data) : [];
                const relevantAnnouncements = allAnnouncements.filter(ann =>
                    ann.audience === 'all' || (Array.isArray(ann.audience) && employee && ann.audience.includes(employee.departmentId))
                ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAnnouncements(relevantAnnouncements);
                checkLoading();
            }, onErrorCallback('announcements'));

            // Upcoming Roster (next 7 days)
            const rostersRef = ref(db, `companies/${companyId}/rosters`);
            const rosterUnsub = onValue(rostersRef, (snapshot) => {
                const data = snapshot.val();
                const assignments: RosterAssignment[] = [];
                if (data) {
                    const today = new Date();
                    for (let i = 0; i < 14; i++) {
                        const d = new Date(today);
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0];
                        if (data[dateStr] && data[dateStr][user.uid]) {
                            assignments.push({ ...data[dateStr][user.uid], date: dateStr, id: `${dateStr}-${user.uid}` });
                        }
                    }
                }
                setUpcomingRoster(assignments);
                checkLoading();
            }, onErrorCallback('roster'));

            return () => {
                todayAttendanceUnsubscribe();
                payrollConfigUnsubscribe();
                leaveRequestsUnsubscribe();
                announcementsUnsubscribe();
                rosterUnsub();
            };
        } else if (!loadingAuth) {
            setLoadingData(false);
        }
    }, [user, loadingAuth, companyId, todayString, router, employee]);

    const payrollDetails = useMemo(() => {
        if (employee && payrollConfig) {
            return calculatePayroll(employee, payrollConfig);
        }
        return null;
    }, [employee, payrollConfig]);

    // Calculate live work duration
    const workDuration = useMemo(() => {
        if (!todayAttendance?.checkInTime) return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };

        const checkIn = parseISO(todayAttendance.checkInTime);
        const endTime = todayAttendance.checkOutTime ? parseISO(todayAttendance.checkOutTime) : currentTime;
        const breakDuration = todayAttendance.breakDuration || 0;

        // If currently on break, don't count that time
        let effectiveEndTime = endTime;
        if (todayAttendance.breakInTime && !todayAttendance.breakOutTime) {
            effectiveEndTime = parseISO(todayAttendance.breakInTime);
        }

        const totalSeconds = differenceInSeconds(effectiveEndTime, checkIn) - (breakDuration * 60);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds, totalMinutes: Math.floor(totalSeconds / 60) };
    }, [todayAttendance, currentTime]);

    // Calculate break duration if on break
    const currentBreakDuration = useMemo(() => {
        if (!todayAttendance?.breakInTime || todayAttendance?.breakOutTime) return null;
        const breakStart = parseISO(todayAttendance.breakInTime);
        return differenceInMinutes(currentTime, breakStart);
    }, [todayAttendance, currentTime]);

    const handleClockIn = async () => {
        if (!user || !companyId) return;
        setIsSubmitting(true);
        setActionType('clockIn');
        try {
            const result = await recordAttendance({ userId: user.uid, action: 'clockIn', companyId });
            if (result.success) {
                toast({ title: "Clocked In", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Clock-in Failed", description: result.message });
            }
        } catch (error) {
            console.error("Clock-in error:", error);
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const handleClockOut = async () => {
        if (!user || !companyId) return;
        setIsSubmitting(true);
        setActionType('clockOut');
        try {
            const result = await recordAttendance({ userId: user.uid, action: 'clockOut', companyId });
            if (result.success) {
                toast({ title: "Clocked Out", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Clock-out Failed", description: result.message });
            }
        } catch (error) {
            console.error("Clock-out error:", error);
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const handleBreakIn = async () => {
        if (!user || !companyId || !todayAttendance) return;
        setIsSubmitting(true);
        setActionType('breakIn');
        try {
            const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}/${user.uid}`);
            await update(attendanceRef, {
                breakInTime: new Date().toISOString(),
                status: 'On Break'
            });
            toast({ title: "Break Started", description: "Enjoy your break!" });
        } catch (error) {
            console.error("Break-in error:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start break." });
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const handleBreakOut = async () => {
        if (!user || !companyId || !todayAttendance?.breakInTime) return;
        setIsSubmitting(true);
        setActionType('breakOut');
        try {
            const breakStart = parseISO(todayAttendance.breakInTime);
            const breakDuration = differenceInMinutes(new Date(), breakStart);
            const totalBreak = (todayAttendance.breakDuration || 0) + breakDuration;

            const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}/${user.uid}`);
            await update(attendanceRef, {
                breakOutTime: new Date().toISOString(),
                breakDuration: totalBreak,
                status: todayAttendance.lateMinutes && todayAttendance.lateMinutes > 0 ? 'Late' : 'Present'
            });
            toast({ title: "Break Ended", description: `Break duration: ${breakDuration} minutes` });
        } catch (error) {
            console.error("Break-out error:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not end break." });
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const handleReportEmergency = async () => {
        if (!employee || !companyId) return;
        setIsReportingEmergency(true);
        try {
            const result = await reportEmergency({ employeeId: employee.id, employeeName: employee.name, companyId });
            if (result.success) {
                toast({
                    title: "Alert Sent",
                    description: result.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Failed to Send Alert",
                    description: result.message,
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not send emergency alert. Please try again or contact HR directly.",
            });
        } finally {
            setIsReportingEmergency(false);
        }
    };

    if (loadingAuth || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const hasClockedIn = !!todayAttendance;
    const hasClockedOut = !!todayAttendance?.checkOutTime;
    const isOnBreak = todayAttendance?.status === 'On Break';
    const dailyTarget = (payrollConfig?.dailyTargetHours || 8) * 60;
    const progressPercent = Math.min(100, (workDuration.totalMinutes / dailyTarget) * 100);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {employee?.name}</CardTitle>
                    <CardDescription>
                        This is your personal space to manage your work life.
                    </CardDescription>
                </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Clock className="h-5 w-5" />
                            Time Clock
                        </CardTitle>
                        <CardDescription>{format(currentTime, 'PPPP')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        {/* Current Time */}
                        <div className="text-4xl font-bold tracking-tighter">
                            {format(currentTime, 'hh:mm:ss a')}
                        </div>

                        {/* Status Badge */}
                        {hasClockedIn && (
                            <Badge
                                variant={isOnBreak ? "secondary" : hasClockedOut ? "outline" : "default"}
                                className={cn(
                                    "text-sm px-3 py-1",
                                    isOnBreak && "bg-orange-100 text-orange-700",
                                    todayAttendance?.status === 'Late' && "bg-red-100 text-red-700"
                                )}
                            >
                                {isOnBreak ? "On Break" : hasClockedOut ? "Shift Complete" : todayAttendance?.status}
                            </Badge>
                        )}

                        {/* Live Work Duration */}
                        {hasClockedIn && !hasClockedOut && (
                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Timer className="h-4 w-4" />
                                        Work Time
                                    </span>
                                    <span className="font-mono font-bold">
                                        {String(workDuration.hours).padStart(2, '0')}:
                                        {String(workDuration.minutes).padStart(2, '0')}:
                                        {String(workDuration.seconds).padStart(2, '0')}
                                    </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                                <p className="text-xs text-center text-muted-foreground">
                                    {workDuration.totalMinutes} / {dailyTarget} min ({Math.round(progressPercent)}%)
                                </p>
                            </div>
                        )}

                        {/* Break Duration Display */}
                        {isOnBreak && currentBreakDuration !== null && (
                            <div className="text-center p-3 bg-orange-50 rounded-lg w-full">
                                <Coffee className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                                <p className="text-sm text-orange-700">Break Time: {currentBreakDuration} min</p>
                            </div>
                        )}

                        {/* Clock In/Out Buttons */}
                        <div className="flex w-full gap-2">
                            <Button
                                className="flex-1"
                                onClick={handleClockIn}
                                disabled={hasClockedIn || isSubmitting}
                            >
                                {isSubmitting && actionType === 'clockIn' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                Clock In
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleClockOut}
                                disabled={!hasClockedIn || hasClockedOut || isOnBreak || isSubmitting}
                            >
                                {isSubmitting && actionType === 'clockOut' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                Clock Out
                            </Button>
                        </div>

                        {/* Break Buttons */}
                        {hasClockedIn && !hasClockedOut && (
                            <div className="flex w-full gap-2">
                                <Button
                                    variant="secondary"
                                    className={cn("flex-1", isOnBreak && "bg-orange-100 hover:bg-orange-200")}
                                    onClick={handleBreakIn}
                                    disabled={isOnBreak || isSubmitting}
                                >
                                    {isSubmitting && actionType === 'breakIn' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
                                    Start Break
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={handleBreakOut}
                                    disabled={!isOnBreak || isSubmitting}
                                >
                                    {isSubmitting && actionType === 'breakOut' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                    End Break
                                </Button>
                            </div>
                        )}

                        {/* Check-in/out times */}
                        {hasClockedIn && (
                            <div className="text-xs text-muted-foreground text-center space-y-1 w-full pt-2 border-t">
                                <p>In: {format(new Date(todayAttendance.checkInTime), 'hh:mm a')}</p>
                                {todayAttendance.breakDuration && todayAttendance.breakDuration > 0 && (
                                    <p>Break: {todayAttendance.breakDuration} min</p>
                                )}
                                {hasClockedOut && (
                                    <p>Out: {format(new Date(todayAttendance.checkOutTime!), 'hh:mm a')}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Announcements</CardTitle>
                        <CardDescription>Latest updates and news from the company.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {announcements.length > 0 ? (
                            <div className="space-y-4">
                                {announcements.slice(0, 3).map(ann => (
                                    <div key={ann.id} className="border-l-4 pl-4">
                                        <p className="font-semibold">{ann.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Posted by {ann.authorName} on {format(new Date(ann.createdAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                No recent announcements.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* My Roster */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5" />
                            My Upcoming Shifts
                        </CardTitle>
                        <CardDescription>Your scheduled shifts for the next 14 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingRoster.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingRoster.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-2 h-10 rounded-full"
                                                style={{ backgroundColor: assignment.shiftColor || '#6366f1' }}
                                            />
                                            <div>
                                                <p className="font-medium">{assignment.date}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {assignment.shiftName || 'On Duty'}
                                                    {assignment.startTime && assignment.endTime && (
                                                        <> • {assignment.startTime} - {assignment.endTime}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={assignment.status === 'Off Day' ? 'secondary' : 'default'}>
                                                {assignment.status}
                                            </Badge>
                                            {employee && companyId && assignment.status !== 'Off Day' && (
                                                <ShiftSwapRequestDialog
                                                    assignment={assignment}
                                                    employee={employee}
                                                    companyId={companyId}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <ArrowLeftRight className="mr-1 h-3 w-3" />
                                                        Request Swap
                                                    </Button>
                                                </ShiftSwapRequestDialog>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                No upcoming shifts scheduled.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {employee && <EmployeeLeaveRequestDialog employee={employee}>
                            <Button>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Request Leave
                            </Button>
                        </EmployeeLeaveRequestDialog>}
                        {employee && <EmployeePayslipDialog employee={employee} payrollDetails={payrollDetails} companyName={company?.name || ''} payslipDate={new Date()}>
                            <Button variant="secondary">
                                <Receipt className="mr-2 h-4 w-4" />
                                View Latest Payslip
                            </Button>
                        </EmployeePayslipDialog>}
                        <SubmitResignationDialog>
                            <Button variant="outline">
                                <LogOutIcon className="mr-2 h-4 w-4" />
                                Submit Resignation
                            </Button>
                        </SubmitResignationDialog>
                        {employee && <ReportConditionDialog employee={employee}>
                            <Button variant="secondary">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Report Condition
                            </Button>
                        </ReportConditionDialog>}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Report Emergency
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Emergency Report</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will immediately alert all HR administrators that you have an emergency. Are you sure you want to proceed?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isReportingEmergency}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReportEmergency} disabled={isReportingEmergency}>
                                        {isReportingEmergency ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                            </>
                                        ) : "Yes, Send Alert"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
