'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { JobVacancy } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Building2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleApplication } from '@/ai/flows/handle-application-flow';
import Link from 'next/link';
import Logo from '@/components/logo';

export default function JobApplicationPage() {
    const params = useParams();
    const jobId = params.jobId as string;
    const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (jobId) {
            const jobRef = ref(db, `jobVacancies/${jobId}`);
            const unsubscribe = onValue(jobRef, (snapshot) => {
                setVacancy(snapshot.val());
                setLoading(false);
            }, (error) => {
                console.error("Firebase read failed:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [jobId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(event.currentTarget);
        
        try {
            const result = await handleApplication(formData);
            if (result.success) {
                toast({
                    title: 'Application Submitted!',
                    description: 'Thank you for applying. We will be in touch shortly.',
                });
                formRef.current?.reset();
                setFileName('');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Submission Failed',
                    description: result.message,
                });
            }
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'An Error Occurred',
                description: 'Could not submit your application. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!vacancy) {
        return <div className="flex h-screen items-center justify-center">Job vacancy not found.</div>;
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Careers
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12">
                <div className="container grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-3xl">{vacancy.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2">
                                    <Building2 className="h-4 w-4" />
                                    {vacancy.departmentName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p>{vacancy.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Apply Now</CardTitle>
                                <CardDescription>Fill out the form below to apply.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                    <input type="hidden" name="jobVacancyId" value={jobId} />
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" name="name" required disabled={isSubmitting} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required disabled={isSubmitting} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" name="phone" type="tel" required disabled={isSubmitting} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="resume">Resume</Label>
                                        <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {fileName || 'Upload your resume'}
                                        </Button>
                                        <Input 
                                            ref={fileInputRef} 
                                            id="resume" 
                                            name="resume" 
                                            type="file" 
                                            className="hidden" 
                                            required 
                                            onChange={handleFileChange}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                                        Submit Application
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
