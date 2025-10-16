
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useAuth } from '@/app/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

function CustomFormInput({ question }: { question: ApplicationFormQuestion }) {
  const commonProps = {
    name: `answers.${question.id}`,
    required: question.required,
  };

  switch (question.type) {
    case 'text':
      return <Input {...commonProps} />;
    case 'textarea':
      return <Textarea {...commonProps} />;
    case 'yesno':
      return (
        <RadioGroup name={commonProps.name} required={commonProps.required} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
            <Label htmlFor={`${question.id}-yes`}>Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="No" id={`${question.id}-no`} />
            <Label htmlFor={`${question.id}-no`}>No</Label>
          </div>
        </RadioGroup>
      );
    default:
      return null;
  }
}

function JobApplicationForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, employee } = useAuth();
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setFileName(file.name);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(event.currentTarget);
        
        // Manually collect custom form answers
        vacancy?.customForm?.forEach(question => {
            const element = event.currentTarget.elements.namedItem(`answers.${question.id}`);
            if (element instanceof RadioNodeList) { // Handle RadioGroup
                formData.set(`answers.${question.id}`, (element as RadioNodeList).value);
            }
        });
        
        try {
            const result = await handleApplication(formData);
            if (result.success) {
                toast({ title: 'Application Submitted!', description: result.message });
                router.push(user ? '/applicant-portal' : '/careers');
            } else {
                toast({ variant: 'destructive', title: 'Submission Failed', description: result.message });
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'An Error Occurred', description: 'Could not submit application.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!vacancy || !companyId || !company) {
        return <div className="flex h-screen items-center justify-center">Job vacancy not found.</div>;
    }

    const isClosed = vacancy.closingDate && new Date() > new Date(vacancy.closingDate);
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', minimumFractionDigits: 0 });

    const isEmailApplication = vacancy.applicationMethod === 'email';

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
                                Closes: {vacancy.closingDate ? format(new Date(vacancy.closingDate), "MMM d, yyyy") : 'N/A'}
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
                             <CardDescription>{isEmailApplication ? 'Submit your application via email.' : (user ? `Applying as ${employee?.name}` : 'Fill in your details to apply.')}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                       {isEmailApplication ? (
                           <div className="space-y-4">
                               <p className="text-sm text-muted-foreground">
                                   This company has requested that applications be sent directly to their email address.
                               </p>
                               <div className="rounded-md border bg-muted p-4">
                                    <p className="font-semibold text-primary">{vacancy.applicationEmail}</p>
                               </div>
                                <Button asChild className="w-full">
                                    <a href={`mailto:${vacancy.applicationEmail}?subject=Application for ${vacancy.title}`}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Open Email Client
                                    </a>
                                </Button>
                           </div>
                       ) : (
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                <input type="hidden" name="companyId" value={companyId} />
                                <input type="hidden" name="jobVacancyId" value={jobId} />
                                <input type="hidden" name="vacancyTitle" value={vacancy.title} />
                                
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required disabled={isClosed || !!user} defaultValue={employee?.name || ''}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required disabled={isClosed || !!user} defaultValue={employee?.email || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone (Optional)</Label>
                                    <Input id="phone" name="phone" type="tel" disabled={isClosed} defaultValue={employee?.phone || ''} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resume">Resume</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || isClosed}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {fileName || (employee?.resumeUrl ? 'Resume on file (upload to replace)' : 'Upload your resume')}
                                    </Button>
                                    <Input ref={fileInputRef} id="resume" name="resume" type="file" className="hidden" onChange={handleFileChange} disabled={isSubmitting || isClosed} />
                                </div>

                                {vacancy.customForm && vacancy.customForm.length > 0 && (
                                    <>
                                        <Separator/>
                                        <h3 className="font-semibold">Application Questions</h3>
                                        {vacancy.customForm.map(question => (
                                            <div key={question.id} className="space-y-2">
                                                <Label htmlFor={`answers.${question.id}`}>
                                                    {question.text} {question.required && <span className="text-destructive">*</span>}
                                                </Label>
                                                <CustomFormInput question={question} />
                                            </div>
                                        ))}
                                    </>
                                )}

                                <Button type="submit" className="w-full" disabled={isSubmitting || isClosed}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                                    {isClosed ? 'Applications Closed' : 'Submit Application'}
                                </Button>
                            </form>
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
