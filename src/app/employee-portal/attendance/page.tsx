
// src/app/employee-portal/attendance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AttendanceRecord } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { AttendanceTab } from '../components/attendance-tab';

export default function AttendancePage() {
    const { user, companyId, loading: authLoading } = useAuth();
    const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user && companyId) {
            const allAttendanceRef = ref(db, `companies/${companyId}/attendance`);
            const unsubscribe = onValue(allAttendanceRef, (snapshot) => {
                const allDataByDate = snapshot.val();
                const userRecords: AttendanceRecord[] = [];
                if (allDataByDate) {
                    Object.keys(allDataByDate).forEach(date => {
                        const recordsForDate = allDataByDate[date];
                        if (recordsForDate && recordsForDate[user.uid]) {
                             userRecords.push({ ...recordsForDate[user.uid], id: `${date}-${user.uid}`, date });
                        }
                    });
                }
                setAllAttendance(userRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed (all attendance):", error);
                setLoadingData(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [user, companyId, authLoading]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return <AttendanceTab attendanceRecords={allAttendance} />;
}
