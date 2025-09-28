'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceReviewsTab } from './components/performance-reviews-tab';
import { FeedbackTab } from './components/feedback-tab';
import { TrainingCatalogTab } from './components/training-catalog-tab';
import { CertificationsTab } from './components/certifications-tab';
import type { Employee, Goal, Feedback, TrainingCourse, Certification } from '@/lib/data';

export default function PerformancePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [courses, setCourses] = useState<TrainingCourse[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const goalsRef = ref(db, 'goals');
        const feedbackRef = ref(db, 'feedback');
        const coursesRef = ref(db, 'trainingCourses');
        const certificationsRef = ref(db, 'certifications');

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
                if (data) {
                    setter(isObject ? Object.values(data) : Object.keys(data).map(key => ({ ...data[key], id: key })));
                } else {
                    setter([]);
                }
                checkLoading();
            };
        };
        
        const createOnErrorCallback = () => {
             return (error: Error) => {
                console.error("Firebase read failed:", error.message);
                checkLoading();
            }
        };

        const employeesUnsubscribe = onValue(employeesRef, createOnValueCallback(setEmployees, true), createOnErrorCallback());
        const goalsUnsubscribe = onValue(goalsRef, createOnValueCallback(setGoals), createOnErrorCallback());
        const feedbackUnsubscribe = onValue(feedbackRef, createOnValueCallback(setFeedback), createOnErrorCallback());
        const coursesUnsubscribe = onValue(coursesRef, createOnValueCallback(setCourses), createOnErrorCallback());
        const certificationsUnsubscribe = onValue(certificationsRef, createOnValueCallback(setCertifications), createOnErrorCallback());
        
        return () => {
            employeesUnsubscribe();
            goalsUnsubscribe();
            feedbackUnsubscribe();
            coursesUnsubscribe();
            certificationsUnsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="reviews">
            <TabsList className="mb-4">
                <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
                <TabsTrigger value="feedback">360-Degree Feedback</TabsTrigger>
                <TabsTrigger value="training">Training Catalog</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews">
                <PerformanceReviewsTab employees={employees} goals={goals} />
            </TabsContent>
            <TabsContent value="feedback">
                <FeedbackTab employees={employees} allFeedback={feedback} />
            </TabsContent>
            <TabsContent value="training">
                <TrainingCatalogTab courses={courses} />
            </TabsContent>
            <TabsContent value="certifications">
                <CertificationsTab employees={employees} allCertifications={certifications} />
            </TabsContent>
        </Tabs>
    );
}
