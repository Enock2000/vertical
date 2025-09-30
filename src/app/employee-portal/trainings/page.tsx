
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Enrollment, TrainingCourse } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { TrainingsTab } from '../components/trainings-tab';

export default function TrainingsPage() {
    const { user, companyId, loading: authLoading } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
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

            const enrollmentsQuery = query(ref(db, `companies/${companyId}/enrollments`), orderByChild('employeeId'), equalTo(user.uid));
            const enrollmentsUnsubscribe = onValue(enrollmentsQuery, (snapshot) => {
                const data = snapshot.val();
                setEnrollments(data ? Object.values(data) : []);
                checkLoading();
            }, onError('enrollments'));

            const coursesRef = ref(db, `companies/${companyId}/trainingCourses`);
            const coursesUnsubscribe = onValue(coursesRef, (snapshot) => {
                const data = snapshot.val();
                setTrainingCourses(data ? Object.values(data) : []);
                checkLoading();
            }, onError('training courses'));

            return () => {
                enrollmentsUnsubscribe();
                coursesUnsubscribe();
            };

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

    return <TrainingsTab enrollments={enrollments} courses={trainingCourses} />;
}
