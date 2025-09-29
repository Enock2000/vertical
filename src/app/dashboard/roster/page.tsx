// src/app/dashboard/roster/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee, LeaveRequest, RosterAssignment } from '@/lib/data';
import { RosterCalendar } from './components/roster-calendar';

export default function RosterPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const leaveRef = ref(db, 'leaveRequests');
        const rosterRef = ref(db, 'rosters');

        let loadedCount = 0;
        const totalToLoad = 3;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const createOnValueCallback = (setter: React.Dispatch<any>) => {
            return (snapshot: any) => {
                const data = snapshot.val();
                if (data) {
                    setter(Object.values(data));
                } else {
                    setter([]);
                }
                checkLoading();
            };
        };

        const onErrorCallback = (error: Error) => {
            console.error("Firebase read failed:", error.message);
            checkLoading();
        };

        const employeesUnsubscribe = onValue(employeesRef, createOnValueCallback(setEmployees), onErrorCallback);
        const leaveUnsubscribe = onValue(leaveRef, createOnValueCallback(setLeaveRequests), onErrorCallback);
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
        }, onErrorCallback);


        return () => {
            employeesUnsubscribe();
            leaveUnsubscribe();
            rosterUnsubscribe();
        };
    }, []);

    return (
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
    );
}
