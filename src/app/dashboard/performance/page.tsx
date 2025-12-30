
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceReviewsTab } from './components/performance-reviews-tab';
import { FeedbackTab } from './components/feedback-tab';
import { TrainingCatalogTab } from './components/training-catalog-tab';
import { CertificationsTab } from './components/certifications-tab';
import type { Employee, Goal, Feedback, TrainingCourse, Certification } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

export default function PerformancePage() {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [courses, setCourses] = useState<TrainingCourse[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const goalsRef = query(ref(db, 'goals'), orderByChild('companyId'), equalTo(companyId));
        const feedbackRef = query(ref(db, 'feedback'), orderByChild('companyId'), equalTo(companyId));
        const coursesRef = query(ref(db, `companies/${companyId}/trainingCourses`));
        const certificationsRef = query(ref(db, 'certifications'), orderByChild('companyId'), equalTo(companyId));

        let loadedCount = 0;
        const totalToLoad = 5;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const createOnValueCallback = (setter: React.Dispatch<any>, isObject?: boolean) => {
            return (snapshot: any) => {
                const data = snapshot.val();
                const list = data ? (isObject ? Object.values(data) : Object.keys(data).map(key => ({ ...data[key], id: key }))) : [];
                setter(list);
                checkLoading();
            };
        };

        const onErrorCallback = (name: string) => (error: Error) => {
            console.error(`Firebase read failed for ${name}:`, error.message);
            checkLoading();
        };

        const employeesUnsubscribe = onValue(query(employeesRef, orderByChild('companyId'), equalTo(companyId)), createOnValueCallback(setEmployees, true), onErrorCallback('employees'));
        const goalsUnsubscribe = onValue(goalsRef, createOnValueCallback(setGoals), onErrorCallback('goals'));
        const feedbackUnsubscribe = onValue(feedbackRef, createOnValueCallback(setFeedback), onErrorCallback('feedback'));
        const coursesUnsubscribe = onValue(coursesRef, createOnValueCallback(setCourses, true), onErrorCallback('courses'));
        const certificationsUnsubscribe = onValue(certificationsRef, createOnValueCallback(setCertifications), onErrorCallback('certifications'));

        return () => {
            employeesUnsubscribe();
            goalsUnsubscribe();
            feedbackUnsubscribe();
            coursesUnsubscribe();
            certificationsUnsubscribe();
        };
    }, [companyId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Filter to only show actual employees (exclude company profiles, admins without employee status, offboarded)
    const filteredEmployees = employees.filter(e =>
        e.status === 'Active' &&
        e.role !== 'GuestAdmin' &&
        e.status !== 'Offboarded' &&
        e.status !== 'Applicant'
    );

    return (
        <Tabs defaultValue="reviews">
            <TabsList className="mb-4">
                <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
                <TabsTrigger value="feedback">360-Degree Feedback</TabsTrigger>
                <TabsTrigger value="training">Training Catalog</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews">
                <PerformanceReviewsTab employees={filteredEmployees} goals={goals} companyId={companyId!} />
            </TabsContent>
            <TabsContent value="feedback">
                <FeedbackTab employees={filteredEmployees} allFeedback={feedback} />
            </TabsContent>
            <TabsContent value="training">
                <TrainingCatalogTab courses={courses} employees={filteredEmployees} />
            </TabsContent>
            <TabsContent value="certifications">
                <CertificationsTab employees={filteredEmployees} allCertifications={certifications} />
            </TabsContent>
        </Tabs>
    );
}
