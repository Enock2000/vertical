

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo, runTransaction, update } from 'firebase/database';
import type { JobVacancy, Company, Applicant } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Building2, Upload, CalendarClock, MapPin, Briefcase, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleApplication } from '@/ai/flows/handle-application-flow';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { Badge } from '@/components/ui/badge';

function JobApplicationForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, employee, loading: authLoading } = useAuth();
    const jobId = params.jobId as string;
    const companyId = searchParams.get('companyId');

    const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
    const [company, setCompany] = useState<Company | { name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (!jobId || !companyId) {
            setLoading(false);
            return;
        }

        const isGuest = companyId === 'guest';
        
        const fetchJobData = async () => {
            try {
                let jobData: JobVacancy | null = null;
                let companyData: Company | { name: string } | null = null;
                const jobRef = ref(db, `companies/${companyId}/jobVacancies/${jobId}`);
                
                // Increment view count
                runTransaction(ref(db, `companies/${companyId}/jobVacancies/${jobId}/views`), (currentValue) => {
                    return (currentValue || 0) + 1;
                });
                
                const companyRef = ref(db, `companies/${companyId}`);
                
                const [jobSnap, companySnap] = await Promise.all([get(jobRef), get(companyRef)]);
                
                if (jobSnap.exists()) {
                    jobData = jobSnap.val();
                }
                if (companySnap.exists()) {
                    companyData = companySnap.val();
                }
                
                setVacancy(jobData);
                setCompany(companyData as Company);

            } catch (error) {
                console.error("Firebase read failed:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load job details.',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();

    }, [jobId, companyId, toast]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!isLoggedInApplicant) {
            toast({
                title: 'Please Log In',
                description: 'You must be logged in as an applicant to apply.',
                action: <Button onClick={() => router.push('/employee-login')}>Login</Button>
            });
            return;
        }

        setIsSubmitting(true);
        
        const formData = new FormData(event.currentTarget);
        
        // If user is logged in, use their details
        if (user && employee) {
            formData.set('name', employee.name);
            formData.set('email', employee.email);
            formData.set('phone', employee.phone || '');
        }

        try {
            const result = await handleApplication(formData);
            if (result.success) {
                toast({
                    title: 'Application Submitted!',
                    description: result.message,
                });
                router.push('/applicant-portal');
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


    if (loading || authLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!vacancy || !companyId || !company) {
        return <div className="flex h-screen items-center justify-center">Job vacancy not found.</div>;
    }

    const isClosed = new Date() > new Date(vacancy.closingDate);
    const isLoggedInApplicant = user && employee && employee.role === 'Applicant';
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', minimumFractionDigits: 0 });

    return (
         <div className="container grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl">{vacancy.title}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                    <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {company.name}</span>
                                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {vacancy.location || 'Not specified'}</span>
                                    <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {vacancy.jobType || 'Not specified'}</span>
                                    {vacancy.salary && <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> {currencyFormatter.format(vacancy.salary)}</span>}
                                </CardDescription>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0">
                               <CalendarClock className="h-4 w-4"/>
                                Closes: {format(new Date(vacancy.closingDate), "MMM d, yyyy")}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Apply Now</CardTitle>
                        {isClosed ? (
                            <CardDescription className="text-destructive">Applications for this position are now closed.</CardDescription>
                        ) : (
                            <CardDescription>{isLoggedInApplicant ? `Logged in as ${employee.name}` : 'Log in to apply for this position.'}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                       {isLoggedInApplicant ? (
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                <input type="hidden" name="companyId" value={companyId} />
                                <input type="hidden" name="jobVacancyId" value={jobId} />
                                <input type="hidden" name="vacancyTitle" value={vacancy.title} />
                                
                                <div className="space-y-2">
                                    <Label htmlFor="resume">Resume (Optional)</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || isClosed}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {fileName || 'Upload your resume'}
                                    </Button>
                                    <Input 
                                        ref={fileInputRef} 
                                        id="resume" 
                                        name="resume" 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        disabled={isSubmitting || isClosed}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting || isClosed}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                                    {isClosed ? 'Applications Closed' : 'Submit Application'}
                                </Button>
                            </form>
                       ) : (
                            <div className="space-y-4">
                               <p className="text-sm text-muted-foreground">You must have an applicant profile to apply for jobs.</p>
                                <Button className="w-full" asChild>
                                    <Link href="/employee-login">Log In to Apply</Link>
                                </Button>
                                 <Button variant="outline" className="w-full" asChild>
                                    <Link href="/applicant-signup">Create Applicant Account</Link>
                                </Button>
                            </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default function JobApplicationPage() {
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
            <main className="flex-1 py-12">
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                    <JobApplicationForm />
                </Suspense>
            </main>
        </div>
    );
}
