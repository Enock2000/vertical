'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceReviewsTab } from './components/performance-reviews-tab';
import { FeedbackTab } from './components/feedback-tab';
import { TrainingCatalogTab } from './components/training-catalog-tab';
import { CertificationsTab } from './components/certifications-tab';

export default function PerformancePage() {
    return (
        <Tabs defaultValue="reviews">
            <TabsList className="mb-4">
                <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
                <TabsTrigger value="feedback">360-Degree Feedback</TabsTrigger>
                <TabsTrigger value="training">Training Catalog</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews">
                <PerformanceReviewsTab />
            </TabsContent>
            <TabsContent value="feedback">
                <FeedbackTab />
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
