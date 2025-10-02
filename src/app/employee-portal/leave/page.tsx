// src/app/employee-portal/leave/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { LeaveRequest } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { LeaveHistoryTab } from '../components/leave-history-tab';

export default function LeavePage() {
    const { user, companyId, loading: authLoading } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user && companyId) {
            const leaveRequestsQuery = query(ref(db, `companies/${companyId}/leaveRequests`), orderByChild('employeeId'), equalTo(user.uid));
            const unsubscribe = onValue(leaveRequestsQuery, (snapshot) => {
                const data = snapshot.val();
                const list: LeaveRequest[] = data ? Object.values(data) : [];
                setLeaveRequests(list.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed (leave requests):", error);
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

    return <LeaveHistoryTab leaveRequests={leaveRequests} />;
}
