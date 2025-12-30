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
import type { Employee, LeaveRequest, RosterAssignment, Shift, AttendanceRecord } from '@/lib/data';

export default function RosterPage() {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);

    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (!companyId) return;

        let loadedCount = 0;
        const totalToLoad = 5;

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

        return () => {
            employeesUnsub();
            leaveUnsub();
            rosterUnsub();
            shiftsUnsub();
            attendanceUnsub();
        };
    }, [companyId, todayString]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="attendance">
            <TabsList className="mb-4">
                <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
                <TabsTrigger value="roster">Roster Calendar</TabsTrigger>
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
        </Tabs>
    );
}
