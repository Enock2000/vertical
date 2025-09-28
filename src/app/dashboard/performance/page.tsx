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
import type { Employee, Goal, Feedback } from '@/lib/data';

export default function PerformancePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const goalsRef = ref(db, 'goals');
        const feedbackRef = ref(db, 'feedback');

        let employeesLoaded = false;
        let goalsLoaded = false;
        let feedbackLoaded = false;

        const checkLoading = () => {
            if (employeesLoaded && goalsLoaded && feedbackLoaded) {
                setLoading(false);
            }
        };

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            setEmployees(data ? Object.values(data) : []);
            employeesLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (employees): " + error.name);
            employeesLoaded = true;
            checkLoading();
        });

        const goalsUnsubscribe = onValue(goalsRef, (snapshot) => {
            const data = snapshot.val();
            const goalsList = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
            setGoals(goalsList);
            goalsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (goals): " + error.name);
            goalsLoaded = true;
            checkLoading();
        });

        const feedbackUnsubscribe = onValue(feedbackRef, (snapshot) => {
            const data = snapshot.val();
            const feedbackList = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
            setFeedback(feedbackList);
            feedbackLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (feedback): " + error.name);
            feedbackLoaded = true;
            checkLoading();
        });

        return () => {
            employeesUnsubscribe();
            goalsUnsubscribe();
            feedbackUnsubscribe();
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
                <TrainingCatalogTab />
            </TabsContent>
            <TabsContent value="certifications">
                <CertificationsTab />
            </TabsContent>
        </Tabs>
    );
}
