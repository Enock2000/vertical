'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, onValue, set, get, update } from 'firebase/database';
import { format } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import type { Employee, AttendanceRecord } from '@/lib/data';
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";

export default function EmployeePortalPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
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
            const employeeRef = ref(db, 'employees/' + user.uid);
            const attendanceRef = ref(db, `attendance/${todayString}/${user.uid}`);

            const employeeUnsubscribe = onValue(employeeRef, (snapshot) => {
                setEmployee(snapshot.val());
            });

            const attendanceUnsubscribe = onValue(attendanceRef, (snapshot) => {
                setAttendanceRecord(snapshot.val());
                setLoadingData(false);
            }, (error) => {
                console.error(error);
                setLoadingData(false);
            });
            
            return () => {
                employeeUnsubscribe();
                attendanceUnsubscribe();
            };
        } else if (!loadingAuth) {
            setLoadingData(false);
        }
    }, [user, loadingAuth, todayString]);

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
                status: 'Present', // Could add logic for 'Late' status
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

    if (loadingAuth || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="mx-auto w-full max-w-sm text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You must be logged in to view this page.</CardDescription>
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
                <div className="grid gap-4 md:grid-cols-2 md:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome, {employee?.name || user.email}</CardTitle>
                            <CardDescription>
                               This is your personal space to manage your attendance and view details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>More features coming soon!</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>Attendance</CardTitle>
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
                </div>
            </main>
        </div>
    )
}
