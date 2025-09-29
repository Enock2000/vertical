
// src/app/dashboard/roster/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee, LeaveRequest, RosterAssignment } from '@/lib/data';
import { RosterCalendar } from './components/roster-calendar';
import { useAuth } from '@/app/auth-provider';

export default function RosterPage() {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const leaveRef = ref(db, `companies/${companyId}/leaveRequests`);
        const rosterRef = ref(db, `companies/${companyId}/rosters`);

        let loadedCount = 0;
        const totalToLoad = 3;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const companyEmployees = Object.values<Employee>(data).filter(e => e.companyId === companyId);
                setEmployees(companyEmployees);
            } else {
                setEmployees([]);
            }
            checkLoading();
        }, (error) => { console.error(error); checkLoading(); });

        const leaveUnsubscribe = onValue(leaveRef, (snapshot) => {
            setLeaveRequests(snapshot.val() ? Object.values(snapshot.val()) : []);
            checkLoading();
        }, (error) => { console.error(error); checkLoading(); });

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
        }, (error) => { console.error(error); checkLoading(); });


        return () => {
            employeesUnsubscribe();
            leaveUnsubscribe();
            rosterUnsubscribe();
        };
    }, [companyId]);

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
