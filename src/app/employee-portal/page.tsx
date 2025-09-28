'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { format } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import type { Employee, AttendanceRecord, PayrollConfig, LeaveRequest, Goal, JobVacancy } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { recordAttendance } from '@/ai/flows/attendance-flow';
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, CalendarPlus, Receipt, ShieldAlert, CalendarDays } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";
import { EmployeeLeaveRequestDialog } from './components/employee-leave-request-dialog';
import { EmployeePayslipDialog } from './components/employee-payslip-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceTab } from './components/attendance-tab';
import { PerformanceTab } from './components/performance-tab';
import { JobsTab } from './components/jobs-tab';

export default function EmployeePortalPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { toast } = useToast();

    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user) {
            let loadedCount = 0;
            const totalToLoad = 6;
            
            const checkLoading = () => {
                loadedCount++;
                if(loadedCount === totalToLoad) {
                    setLoadingData(false);
                }
            }

            const employeeRef = ref(db, 'employees/' + user.uid);
            const todayAttendanceRef = ref(db, `attendance/${todayString}/${user.uid}`);
            const allAttendanceRef = ref(db, 'attendance');
            const payrollConfigRef = ref(db, 'payrollConfig');
            const leaveRequestsQuery = query(ref(db, 'leaveRequests'), orderByChild('employeeId'), equalTo(user.uid));
            const goalsQuery = query(ref(db, 'goals'), orderByChild('employeeId'), equalTo(user.uid));
            const jobsRef = ref(db, 'jobVacancies');

            const onValueCallback = (setter: React.Dispatch<any>, isObject: boolean = false) => (snapshot: any) => {
                const data = snapshot.val();
                if (data) {
                    setter(isObject ? data : Object.values(data));
                } else {
                    setter(isObject ? null : []);
                }
                checkLoading();
            };
            
            const onErrorCallback = (error: Error) => {
                console.error(error);
                checkLoading();
            };
            
            // Fetch all attendance and then filter client-side
            const allAttendanceUnsubscribe = onValue(ref(db, 'attendance'), (snapshot) => {
                const allData = snapshot.val();
                const userRecords: AttendanceRecord[] = [];
                if (allData) {
                    Object.keys(allData).forEach(date => {
                        const dayRecord = allData[date][user.uid];
                        if (dayRecord) {
                            userRecords.push({ ...dayRecord, id: `${date}-${user.uid}`, date });
                        }
                    });
                }
                setAllAttendance(userRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                checkLoading();
            }, onErrorCallback);


            const employeeUnsubscribe = onValue(employeeRef, onValueCallback(setEmployee, true), onErrorCallback);
            const todayAttendanceUnsubscribe = onValue(todayAttendanceRef, onValueCallback(setTodayAttendance, true), onErrorCallback);
            const payrollConfigUnsubscribe = onValue(payrollConfigRef, onValueCallback(setPayrollConfig, true), onErrorCallback);
            const leaveRequestsUnsubscribe = onValue(leaveRequestsQuery, onValueCallback(setLeaveRequests), onErrorCallback);
            const goalsUnsubscribe = onValue(goalsQuery, onValueCallback(setGoals), onErrorCallback);
            const jobsUnsubscribe = onValue(jobsRef, (snapshot) => {
                const data = snapshot.val();
                if(data) {
                    const openJobs = Object.values<JobVacancy>(data).filter(j => j.status === 'Open');
                    setJobVacancies(openJobs);
                } else {
                    setJobVacancies([]);
                }
                checkLoading();
            }, onErrorCallback);

            
            return () => {
                employeeUnsubscribe();
                todayAttendanceUnsubscribe();
                allAttendanceUnsubscribe();
                payrollConfigUnsubscribe();
                leaveRequestsUnsubscribe();
                goalsUnsubscribe();
                jobsUnsubscribe();
            };
        } else if (!loadingAuth) {
            setLoadingData(false);
        }
    }, [user, loadingAuth, todayString]);

    const payrollDetails = useMemo(() => {
        if (employee && payrollConfig) {
            return calculatePayroll(employee, payrollConfig);
        }
        return null;
    }, [employee, payrollConfig]);

    const handleClockIn = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const result = await recordAttendance({ userId: user.uid, action: 'clockIn' });
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
        }
    };

    const handleClockOut = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const result = await recordAttendance({ userId: user.uid, action: 'clockOut' });
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
        }
    };

    const handleReportEmergency = () => {
        const adminEmail = "admin@verticalsync.com";
        const subject = `Emergency Report from ${employee?.name}`;
        const body = `This is an automated emergency alert from the employee portal.\n\nEmployee: ${employee?.name}\nEmail: ${employee?.email}\n\nPlease contact them immediately to ensure their safety.`;
        window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (loadingAuth || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user || !employee) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="mx-auto w-full max-w-sm text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You must be logged in to view this page or your employee profile could not be found.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/employee-login" className="text-primary underline">
                            Go to login
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const hasClockedIn = !!todayAttendance;
    const hasClockedOut = !!todayAttendance?.checkOutTime;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Logo />
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Welcome, {employee.name}</CardTitle>
                        <CardDescription>
                            This is your personal space to manage your work life.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Tabs defaultValue="dashboard">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                            <Card className="lg:col-span-1">
                                <CardHeader className="text-center">
                                    <CardTitle>Time Clock</CardTitle>
                                    <CardDescription>{format(currentTime, 'PPPP')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                    <div className="text-4xl font-bold tracking-tighter">
                                        {format(currentTime, 'hh:mm:ss a')}
                                    </div>
                                    <div className="flex w-full gap-4">
                                        <Button className="flex-1" onClick={handleClockIn} disabled={hasClockedIn || isSubmitting}>
                                            {isSubmitting && !hasClockedIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                            Clock In
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={handleClockOut} disabled={!hasClockedIn || hasClockedOut || isSubmitting}>
                                            {isSubmitting && hasClockedIn && !hasClockedOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                            Clock Out
                                        </Button>
                                    </div>
                                    {hasClockedIn && (
                                        <div className="text-sm text-muted-foreground text-center mt-2">
                                            <p>Checked in at: {format(new Date(todayAttendance.checkInTime), 'hh:mm a')}</p>
                                            {hasClockedOut && (
                                                <p>Checked out at: {format(new Date(todayAttendance.checkOutTime!), 'hh:mm a')}</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-1">
                                <CardHeader>
                                     <CardTitle className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5"/>
                                        Leave Balance
                                    </CardTitle>
                                    <CardDescription>Your available annual leave days.</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="text-5xl font-bold">{employee.annualLeaveBalance}</div>
                                    <p className="text-muted-foreground">days remaining</p>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>My Leave Requests</CardTitle>
                                    <CardDescription>A history of your recent leave applications.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                {leaveRequests.length > 0 ? (
                                    <div className="space-y-4">
                                        {leaveRequests.slice(0, 3).map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-2 rounded-md border">
                                                <div>
                                                    <p className="font-medium">{req.leaveType} Leave</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(req.startDate), 'MMM d, yyyy')} - {format(new Date(req.endDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                        You haven't made any leave requests yet.
                                    </div>
                                )}
                                </CardContent>
                            </Card>

                             <Card className="lg:col-span-3">
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    <EmployeeLeaveRequestDialog employee={employee}>
                                        <Button>
                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                            Request Leave
                                        </Button>
                                    </EmployeeLeaveRequestDialog>
                                    <EmployeePayslipDialog employee={employee} payrollDetails={payrollDetails}>
                                        <Button variant="secondary">
                                            <Receipt className="mr-2 h-4 w-4" />
                                            View Latest Payslip
                                        </Button>
                                    </EmployeePayslipDialog>
                                    <Button variant="destructive" onClick={handleReportEmergency}>
                                        <ShieldAlert className="mr-2 h-4 w-4" />
                                        Report Emergency
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="attendance">
                        <AttendanceTab attendanceRecords={allAttendance} />
                    </TabsContent>
                    <TabsContent value="performance">
                        <PerformanceTab goals={goals} />
                    </TabsContent>
                    <TabsContent value="jobs">
                       <JobsTab jobs={jobVacancies} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
