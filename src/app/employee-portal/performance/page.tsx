
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Goal } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { PerformanceTab } from '../components/performance-tab';

export default function PerformancePage() {
    const { user, loading: authLoading } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user) {
            const goalsQuery = query(ref(db, 'goals'), orderByChild('employeeId'), equalTo(user.uid));
            const unsubscribe = onValue(goalsQuery, (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
                setGoals(list);
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed (goals):", error);
                setLoadingData(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [user, authLoading]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return <PerformanceTab goals={goals} />;
}
