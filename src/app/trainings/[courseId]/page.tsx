
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { TrainingCourse, Question } from '@/lib/data';
import { submitTraining } from '@/ai/flows/submit-training-flow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Logo from '@/components/logo';

const formSchema = z.object({
  answers: z.record(z.string().min(1, { message: "This question is required." })),
});

type TrainingFormValues = z.infer<typeof formSchema>;

export default function TrainingCoursePage() {
    const { user, employee, companyId, company } = useAuth();
    const params = useParams();
    const courseId = params.courseId as string;
    const router = useRouter();
    const { toast } = useToast();
    
    const [course, setCourse] = useState<TrainingCourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TrainingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            answers: {},
        },
    });

    useEffect(() => {
        if (companyId && courseId) {
            const courseRef = ref(db, `companies/${companyId}/trainingCourses/${courseId}`);
            const unsubscribe = onValue(courseRef, (snapshot) => {
                setCourse(snapshot.val());
                setLoading(false);
            }, (error) => {
                console.error("Firebase read failed:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
             setLoading(false);
        }
    }, [companyId, courseId]);

    async function onSubmit(values: TrainingFormValues) {
        if (!companyId || !employee) return;
        setIsSubmitting(true);
        try {
            const result = await submitTraining({
                companyId,
                employeeId: employee.id,
                courseId,
                answers: values.answers,
            });

            if (result.success) {
                toast({
                    title: 'Training Completed!',
                    description: 'Your answers have been submitted successfully.',
                });
                router.push('/employee-portal');
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Submission Failed',
                    description: result.message,
                });
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
     if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!course) {
        return <div className="flex h-screen items-center justify-center">Training course not found.</div>;
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between">
                    <Logo companyName={company?.name} />
                    <Button variant="ghost" asChild>
                        <Link href="/employee-portal">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Portal
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12">
                 <div className="container max-w-2xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-3xl">{course.title}</CardTitle>
                                    <CardDescription>{course.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {course.questions?.map((question, index) => (
                                        <FormField
                                            key={question.id}
                                            control={form.control}
                                            name={`answers.${question.id}`}
                                            render={({ field }) => (
                                                <FormItem className="rounded-md border p-4">
                                                    <FormLabel className="text-base">Question {index + 1}: {question.text}</FormLabel>
                                                    <FormControl>
                                                        {question.type === 'multiple-choice' ? (
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex flex-col space-y-2 pt-2"
                                                            >
                                                                {question.options?.map((option, i) => (
                                                                     <FormItem key={i} className="flex items-center space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <RadioGroupItem value={option} />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal">{option}</FormLabel>
                                                                    </FormItem>
                                                                ))}
                                                            </RadioGroup>
                                                        ) : (
                                                            <Textarea
                                                                placeholder="Type your answer here..."
                                                                className="mt-2"
                                                                {...field}
                                                            />
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Answers'
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </Form>
                 </div>
            </main>
        </div>
    );
}

