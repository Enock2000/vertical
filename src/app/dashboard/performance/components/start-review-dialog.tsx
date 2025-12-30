// src/app/dashboard/performance/components/start-review-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee, Goal, PerformanceReview } from '@/lib/data';
import { createNotification } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

const formSchema = z.object({
    selfAssessment: z.string().min(20, 'Please provide a detailed self-assessment (at least 20 characters).'),
    managerFeedback: z.string().min(20, 'Please provide detailed feedback (at least 20 characters).'),
    overallRating: z.number().min(1).max(5),
});

type ReviewFormValues = z.infer<typeof formSchema>;

interface StartReviewDialogProps {
    children: React.ReactNode;
    employee: Employee;
    goals: Goal[];
    companyId: string;
}

export function StartReviewDialog({
    children,
    employee,
    goals,
    companyId
}: StartReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const { toast } = useToast();
    const { user } = useAuth();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selfAssessment: '',
            managerFeedback: '',
            overallRating: 0,
        },
    });

    async function onSubmit(values: ReviewFormValues) {
        if (rating === 0) {
            toast({
                variant: 'destructive',
                title: 'Rating Required',
                description: 'Please select an overall rating before submitting.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const reviewsRef = ref(db, `companies/${companyId}/performanceReviews`);
            const newReviewRef = push(reviewsRef);

            const newReview: Omit<PerformanceReview, 'id'> = {
                companyId: companyId,
                employeeId: employee.id,
                reviewerId: user?.uid || 'unknown',
                reviewDate: new Date().toISOString(),
                status: 'Completed',
                goals: goals,
                employeeSelfAssessment: values.selfAssessment,
                managerFeedback: values.managerFeedback,
                overallRating: rating as 1 | 2 | 3 | 4 | 5,
            };

            await set(newReviewRef, { ...newReview, id: newReviewRef.key });

            // Notify the employee
            await createNotification(companyId, {
                userId: employee.id,
                title: 'Performance Review Completed',
                message: `Your performance review has been completed. Overall rating: ${rating}/5`,
                link: '/employee-portal',
            });

            setOpen(false);
            form.reset();
            setRating(0);
            toast({
                title: 'Review Submitted',
                description: `Performance review for ${employee.name} has been saved.`,
            });

        } catch (error: any) {
            console.error("Error saving review:", error);
            toast({
                variant: "destructive",
                title: "Failed to save review",
                description: error.message || "An unexpected error occurred."
            });
        } finally {
            setIsLoading(false);
        }
    }

    const ratingLabels = ['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Performance Review for {employee.name}</DialogTitle>
                    <DialogDescription>
                        Complete the performance review by providing feedback and an overall rating.
                    </DialogDescription>
                </DialogHeader>

                {/* Goals Summary */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium">Current Goals ({goals.length})</h4>
                    {goals.length > 0 ? (
                        <ul className="space-y-1">
                            {goals.map(goal => (
                                <li key={goal.id} className="flex items-center justify-between text-sm">
                                    <span className="truncate">{goal.title}</span>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        goal.status === 'Completed' && "text-green-600",
                                        goal.status === 'On Track' && "text-blue-600",
                                        goal.status === 'At Risk' && "text-orange-600"
                                    )}>
                                        {goal.progress}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No goals set for this review period.</p>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="selfAssessment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee Self-Assessment</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter the employee's self-assessment of their performance..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="managerFeedback"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager Feedback</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide detailed feedback on the employee's performance..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Star Rating */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Overall Rating</label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => {
                                            setRating(star);
                                            form.setValue('overallRating', star);
                                        }}
                                    >
                                        <Star
                                            className={cn(
                                                "h-8 w-8 transition-colors",
                                                (hoveredRating || rating) >= star
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {ratingLabels[hoveredRating || rating] || 'Select a rating'}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Submit Review'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
