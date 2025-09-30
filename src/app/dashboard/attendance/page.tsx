
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { AttendanceRecord, Employee, PayrollConfig } from '@/lib/data';
import { recordAttendance } from '@/ai/flows/attendance-flow';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';

export default function AttendancePage() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [submittingIds, setSubmittingIds] = useState<string[]>([]);
    
    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (!companyId) return;

        const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}`);
        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, `companies/${companyId}/payrollConfig`);

        let attendanceLoaded = false;
        let employeesLoaded = false;
        let configLoaded = false;

        const checkLoading = () => {
            if (attendanceLoaded && employeesLoaded && configLoaded) {
                setLoading(false);
            }
        };

        const attendanceUnsubscribe = onValue(attendanceRef, (snapshot) => {
            setAttendanceRecords(snapshot.val() || {});
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
                const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.status === 'Active');
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
    }, [companyId, todayString]);

     const handleClockAction = useCallback(async (employeeId: string, action: 'clockIn' | 'clockOut') => {
        if (!companyId) return;
        setSubmittingIds(prev => [...prev, employeeId]);
        try {
            const result = await recordAttendance({ userId: employeeId, action, companyId });
            if (result.success) {
                toast({ title: `Successfully ${action === 'clockIn' ? 'Clocked In' : 'Clocked Out'}` });
            } else {
                toast({ variant: "destructive", title: "Action Failed", description: result.message });
            }
        } catch (error: any) {
            console.error(`${action} error:`, error);
            toast({ variant: "destructive", title: "Error", description: `An unexpected error occurred during ${action}.` });
        } finally {
            setSubmittingIds(prev => prev.filter(id => id !== employeeId));
        }
    }, [companyId, toast]);
    
    const enrichedAttendanceRecords = useMemo(() => {
        return employees.map(employee => {
            const record = attendanceRecords[employee.id];
            return {
                ...record,
                id: employee.id, // Use employee ID as the key for the row
                employeeId: employee.id,
                employeeName: employee.name,
                role: employee.role,
                departmentName: employee.departmentName,
                avatar: employee.avatar,
                email: employee.email,
                dailyTargetHours: payrollConfig?.dailyTargetHours,
                onClockIn: () => handleClockAction(employee.id, 'clockIn'),
                onClockOut: () => handleClockAction(employee.id, 'clockOut'),
                isSubmitting: submittingIds.includes(employee.id),
            };
        });
    }, [attendanceRecords, employees, payrollConfig, handleClockAction, submittingIds]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>
                    Daily attendance records for {format(new Date(), 'MMMM d, yyyy')}. Admins can manually clock employees in or out.
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
