'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { AttendanceRecord } from '@/lib/data';

export default function AttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    // For now, we'll just fetch today's attendance.
    // A date picker could be added for more functionality.
    const todayString = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const attendanceRef = ref(db, `attendance/${todayString}`);

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
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
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed (attendance): " + error.name);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [todayString]);

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
                    <DataTable columns={columns} data={attendanceRecords} />
                )}
            </CardContent>
        </Card>
    );
}
