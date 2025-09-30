
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { RosterAssignment, LeaveRequest } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { RosterTab } from '../components/roster-tab';

export default function RosterPage() {
    const { user, companyId, loading: authLoading } = useAuth();
    const [rosterAssignments, setRosterAssignments] = useState<RosterAssignment[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user && companyId) {
            let loadedCount = 0;
            const totalToLoad = 2;
            const checkLoading = () => {
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    setLoadingData(false);
                }
            };
            
            const onError = (name:string) => (error: Error) => {
                console.error(`Firebase read failed (${name}):`, error);
                checkLoading();
            }

            const rosterQuery = query(ref(db, `companies/${companyId}/rosters`), orderByChild('employeeId'), equalTo(user.uid));
            const rosterUnsubscribe = onValue(rosterQuery, (snapshot) => {
                const allData = snapshot.val();
                const userAssignments: RosterAssignment[] = [];
                if (allData) {
                    Object.keys(allData).forEach(date => {
                         const assignmentsForDate = allData[date];
                         if (assignmentsForDate[user.uid]) {
                            userAssignments.push({ ...assignmentsForDate[user.uid], id: `${date}-${user.uid}`});
                         }
                    });
                }
                setRosterAssignments(userAssignments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                checkLoading();
            }, onError('roster'));

            const leaveRequestsQuery = query(ref(db, `companies/${companyId}/leaveRequests`), orderByChild('employeeId'), equalTo(user.uid));
            const leaveRequestsUnsubscribe = onValue(leaveRequestsQuery, (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
                setLeaveRequests(list);
                checkLoading();
            }, onError('leave requests'));


            return () => {
                rosterUnsubscribe();
                leaveRequestsUnsubscribe();
            }

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

    return <RosterTab rosterAssignments={rosterAssignments} leaveRequests={leaveRequests} />;
}
