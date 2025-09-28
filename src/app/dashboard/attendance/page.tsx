'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { AttendanceRecord, Employee, PayrollConfig } from '@/lib/data';

export default function AttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [loading, setLoading] = useState(true);
    
    // For now, we'll just fetch today's attendance.
    // A date picker could be added for more functionality.
    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const attendanceRef = ref(db, `attendance/${todayString}`);
        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, 'payrollConfig');

        let attendanceLoaded = false;
        let employeesLoaded = false;
        let configLoaded = false;

        const checkLoading = () => {
            if (attendanceLoaded && employeesLoaded && configLoaded) {
                setLoading(false);
            }
        };

        const attendanceUnsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const recordsList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setAttendanceRecords(recordsList);
            } else {
                setAttendanceRecords([]);
            }
            attendanceLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (attendance): " + error.name);
            attendanceLoaded = true;
            checkLoading();
        });

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            employeesLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (employees): " + error.name);
            employeesLoaded = true;
            checkLoading();
        });

        const configUnsubscribe = onValue(configRef, (snapshot) => {
            setPayrollConfig(snapshot.val());
            configLoaded = true;
            checkLoading();
        });

        return () => {
            attendanceUnsubscribe();
            employeesUnsubscribe();
            configUnsubscribe();
        };
    }, [todayString]);
    
    const enrichedAttendanceRecords = useMemo(() => {
        const employeeMap = new Map(employees.map(e => [e.id, e]));
        return attendanceRecords.map(record => {
            const employee = employeeMap.get(record.employeeId);
            return {
                ...record,
                role: employee?.role || '-',
                departmentName: employee?.departmentName || '-',
                avatar: employee?.avatar || '',
                email: employee?.email || '',
                dailyTargetHours: payrollConfig?.dailyTargetHours,
            };
        });
    }, [attendanceRecords, employees, payrollConfig]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>
                    Daily attendance records for {format(new Date(), 'MMMM d, yyyy')}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <DataTable columns={columns} data={enrichedAttendanceRecords} />
                )}
            </CardContent>
        </Card>
    );
}
