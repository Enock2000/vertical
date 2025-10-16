// src/app/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, runTransaction } from 'firebase/database';
import type { JobVacancy, Company, ApplicationFormQuestion } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Building2, Upload, CalendarClock, MapPin, Briefcase, DollarSign, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleApplication } from '@/ai/flows/handle-application-flow';
import Link from 'next/link';
import Logo from '@/components/logo';
import { format } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ApplicantForm } from '../careers/components/applicant-form';


function JobApplicationForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    router = useRouter();
    const { user, employee } = useAuth();
    const jobId = params.jobId as string;
    const companyId = searchParams.get('companyId');

    const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
    const [company, setCompany] = useState<Company | { name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!jobId || !companyId) {
            setLoading(false);
            return;
        }

        const fetchJobData = async () => {
            try {
                const jobRef = ref(db, `companies/${companyId}/jobVacancies/${jobId}`);
                runTransaction(ref(db, `companies/${companyId}/jobVacancies/${jobId}/views`), (currentValue) => (currentValue || 0) + 1);
                
                const companyRef = ref(db, `companies/${companyId}`);
                const [jobSnap, companySnap] = await Promise.all([get(jobRef), get(companyRef)]);
                
                setVacancy(jobSnap.exists() ? jobSnap.val() : null);
                setCompany(companySnap.exists() ? companySnap.val() : null);

            } catch (error) {
                console.error("Firebase read failed:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load job details.' });
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [jobId, companyId, toast]);
    
    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!vacancy || !companyId || !company) {
        return <div className="flex h-screen items-center justify-center">Job vacancy not found.</div>;
    }
    
    return (
        <div className="container py-8">
            <div className="mx-auto max-w-5xl">
                 <div className="mb-8 p-6 bg-primary text-primary-foreground rounded-lg">
                    <h1 className="text-3xl font-bold">{vacancy.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-primary-foreground/80">
                        <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {company.name}</span>
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {vacancy.location || 'Not specified'}</span>
                        <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {vacancy.jobType || 'Not specified'}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                             <CardContent className="p-6">
                                <div className="prose dark:prose-invert max-w-none">
                                   <h4 className="font-semibold">Job Description</h4>
                                    <p>{vacancy.description}</p>
                                    {vacancy.requirements && (
                                        <>
                                            <h4 className="font-semibold">Requirements</h4>
                                            <p>{vacancy.requirements}</p>
                                        </>
                                    )}
                                </div>
                             </CardContent>
                        </Card>
                    </div>
                     <div className="md:col-span-1">
                        <ApplicantForm job={vacancy} onSubmitted={() => router.push('/applicant-portal')} />
                    </div>
                </div>
            </div>
        </div>
    )
}


export default function JobPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <Button variant="ghost" asChild>
                        <Link href="/careers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Jobs Centre
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1">
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                    <JobApplicationForm />
                </Suspense>
            </main>
        </div>
    );
}
