'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, onValue, set, update } from 'firebase/database';
import { format } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import type { Employee, AttendanceRecord, PayrollConfig, LeaveRequest } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, CalendarPlus, Receipt, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";
import { EmployeeLeaveRequestDialog } from './components/employee-leave-request-dialog';
import { EmployeePayslipDialog } from './components/employee-payslip-dialog';
import { Badge } from '@/components/ui/badge';

export default function EmployeePortalPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
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
            let employeeLoaded = false;
            let attendanceLoaded = false;
            let payrollConfigLoaded = false;
            let leaveRequestsLoaded = false;
            
            const checkLoading = () => {
                if(employeeLoaded && attendanceLoaded && payrollConfigLoaded && leaveRequestsLoaded) {
                    setLoadingData(false);
                }
            }

            const employeeRef = ref(db, 'employees/' + user.uid);
            const attendanceRef = ref(db, `attendance/${todayString}/${user.uid}`);
            const payrollConfigRef = ref(db, 'payrollConfig');
            const leaveRequestsRef = ref(db, 'leaveRequests');

            const employeeUnsubscribe = onValue(employeeRef, (snapshot) => {
                setEmployee(snapshot.val());
                employeeLoaded = true;
                checkLoading();
            });

            const attendanceUnsubscribe = onValue(attendanceRef, (snapshot) => {
                setAttendanceRecord(snapshot.val());
                attendanceLoaded = true;
                checkLoading();
            }, (error) => {
                console.error(error);
                attendanceLoaded = true;
                checkLoading();
            });

            const payrollConfigUnsubscribe = onValue(payrollConfigRef, (snapshot) => {
                setPayrollConfig(snapshot.val());
                payrollConfigLoaded = true;
                checkLoading();
            });

            const leaveRequestsUnsubscribe = onValue(leaveRequestsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const allRequests: LeaveRequest[] = Object.values(data);
                    const userRequests = allRequests.filter(req => req.employeeId === user.uid);
                    setLeaveRequests(userRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
                } else {
                    setLeaveRequests([]);
                }
                leaveRequestsLoaded = true;
                checkLoading();
            });
            
            return () => {
                employeeUnsubscribe();
                attendanceUnsubscribe();
                payrollConfigUnsubscribe();
                leaveRequestsUnsubscribe();
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
        if (!user || !employee) return;
        setIsSubmitting(true);
        try {
            const now = new Date();
            const record: AttendanceRecord = {
                id: user.uid,
                employeeId: user.uid,
                employeeName: employee.name,
                date: todayString,
                checkInTime: now.toISOString(),
                checkOutTime: null,
                status: 'Present',
            };
            const attendanceRef = ref(db, `attendance/${todayString}/${user.uid}`);
            await set(attendanceRef, record);
            toast({ title: "Clocked In", description: "Your attendance has been recorded." });
        } catch (error) {
            console.error("Clock-in error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to clock in." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClockOut = async () => {
        if (!user || !attendanceRecord) return;
        setIsSubmitting(true);
        try {
            const now = new Date();
            const attendanceRef = ref(db, `attendance/${todayString}/${user.uid}`);
            await update(attendanceRef, { checkOutTime: now.toISOString() });
            toast({ title: "Clocked Out", description: "Your checkout has been recorded." });
        } catch (error) {
            console.error("Clock-out error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to clock out." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReportEmergency = () => {
        // Replace with the actual HR/Admin email
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
    
    const hasClockedIn = !!attendanceRecord;
    const hasClockedOut = !!attendanceRecord?.checkOutTime;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Logo />
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Welcome, {employee.name}</CardTitle>
                            <CardDescription>
                               This is your personal space to manage your attendance, leave, and view your details.
                            </CardDescription>
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
                                <Button
                                    className="flex-1"
                                    onClick={handleClockIn}
                                    disabled={hasClockedIn || isSubmitting}
                                >
                                    {isSubmitting && !hasClockedIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                    Clock In
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleClockOut}
                                    disabled={!hasClockedIn || hasClockedOut || isSubmitting}
                                >
                                     {isSubmitting && hasClockedIn && !hasClockedOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                    Clock Out
                                </Button>
                            </div>
                            {hasClockedIn && (
                                <div className="text-sm text-muted-foreground text-center mt-2">
                                    <p>Checked in at: {format(new Date(attendanceRecord.checkInTime), 'hh:mm a')}</p>
                                    {hasClockedOut && (
                                        <p>Checked out at: {format(new Date(attendanceRecord.checkOutTime!), 'hh:mm a')}</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>My Leave Requests</CardTitle>
                            <CardDescription>A history of your recent leave applications.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {leaveRequests.length > 0 ? (
                            <div className="space-y-4">
                                {leaveRequests.slice(0, 5).map(req => ( // Show latest 5
                                     <div key={req.id} className="flex items-center justify-between p-2 rounded-md border">
                                        <div>
                                            <p className="font-medium">{req.leaveType} Leave</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(req.startDate), 'MMM d, yyyy')} - {format(new Date(req.endDate), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                         <Badge 
                                            variant={
                                                req.status === 'Approved' ? 'default' :
                                                req.status === 'Rejected' ? 'destructive' :
                                                'secondary'
                                            }
                                        >
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
                </div>
            </main>
        </div>
    )
}
