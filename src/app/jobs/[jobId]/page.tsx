// src/app/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, get, runTransaction } from 'firebase/database';
import type { JobVacancy, Company } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Building2, Briefcase, MapPin, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import { ApplicantForm } from '@/app/careers/components/applicant-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function JobDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = params.jobId as string;
    const companyId = searchParams.get('companyId');

    const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
    const [company, setCompany] = useState<Company | { name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!vacancy || !companyId || !company) {
        return <div className="flex h-screen items-center justify-center">Job vacancy not found.</div>;
    }
    
    const handleApplyClick = () => {
        if (activeTab === 'overview') {
            setActiveTab('application');
        } else {
            formRef.current?.requestSubmit();
        }
    }

    return (
        <div className="container py-8">
            <div className="mx-auto max-w-5xl">
                 <div className="mb-8 p-6 bg-primary text-primary-foreground rounded-lg">
                    <Button variant="ghost" className="mb-4 hover:bg-primary/20 text-primary-foreground" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        All roles
                    </Button>
                    <h1 className="text-4xl font-bold">{vacancy.title} | {vacancy.location}</h1>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <aside className="md:col-span-1 space-y-6">
                        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                             <div className="flex items-center gap-4 mb-4">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Team</p>
                                    <p className="font-semibold">{vacancy.departmentName}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4 mb-4">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Employment type</p>
                                    <p className="font-semibold">{vacancy.jobType || 'Full-Time'}</p>
                                </div>
                             </div>
                              <div className="flex items-center gap-4 mb-4">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <p className="font-semibold">{vacancy.location}</p>
                                </div>
                             </div>
                              <div className="flex items-center gap-4">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Company</p>
                                    <p className="font-semibold">{company.name}</p>
                                </div>
                             </div>
                        </div>
                    </aside>
                    <div className="md:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="application">Application</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview" className="mt-6">
                                <div className="prose dark:prose-invert max-w-none">
                                   <h2 className="font-semibold text-xl">Who we are is what we do.</h2>
                                    <p>{vacancy.description}</p>
                                    {vacancy.requirements && (
                                        <>
                                            <h3 className="font-semibold text-lg">Requirements</h3>
                                            <p>{vacancy.requirements}</p>
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                             <TabsContent value="application" className="mt-6">
                                <ApplicantForm 
                                    ref={formRef}
                                    job={vacancy} 
                                    onSubmitted={() => router.push('/applicant-portal')}
                                    isSubmitting={isSubmitting}
                                    setIsSubmitting={setIsSubmitting} 
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
             {(activeTab === 'overview' || activeTab === 'application') && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t flex justify-center z-10">
                    <Button size="lg" onClick={handleApplyClick} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : 'Apply for this job'}
                    </Button>
                </div>
             )}
        </div>
    )
}


export default function JobPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary">Home</Link>
                        <Link href="/careers" className="text-sm font-medium hover:text-primary">Jobs</Link>
                    </div>
                </div>
            </header>
            <main className="flex-1 pb-24">
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                    <JobDetailsPage />
                </Suspense>
            </main>
        </div>
    );
}
