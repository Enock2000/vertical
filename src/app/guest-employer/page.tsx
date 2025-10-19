// src/app/guest-employer/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, runTransaction } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { JobVacancy, Applicant } from '@/lib/data';
import { Loader2, Briefcase, ExternalLink, Users, Eye, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AddGuestJobDialog } from './components/add-guest-job-dialog';

export default function GuestEmployerDashboard() {
    const { user, companyId, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<JobVacancy[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!companyId) {
            if (!authLoading) setLoadingData(false);
            return;
        }

        let jobsLoaded = false;
        let applicantsLoaded = false;

        const checkLoading = () => {
            if (jobsLoaded && applicantsLoaded) {
                setLoadingData(false);
            }
        };

        const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
        const jobsUnsubscribe = onValue(jobsRef, (snapshot) => {
            const data = snapshot.val();
            const list: JobVacancy[] = data ? Object.values(data) : [];
            setJobs(list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            jobsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (jobs):", error);
            jobsLoaded = true;
            checkLoading();
        });

        const applicantsRef = ref(db, `companies/${companyId}/applicants`);
        const applicantsUnsubscribe = onValue(applicantsRef, (snapshot) => {
            const data = snapshot.val();
            const list: Applicant[] = data ? Object.values(data) : [];
            setApplicants(list);
            applicantsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (applicants):", error);
            applicantsLoaded = true;
            checkLoading();
        });

        return () => {
            jobsUnsubscribe();
            applicantsUnsubscribe();
        };

    }, [companyId, authLoading]);

    const jobsWithStats = useMemo(() => {
        return jobs.map(job => ({
            ...job,
            applicantCount: applicants.filter(app => app.jobVacancyId === job.id).length,
            views: job.views || 0,
        }));
    }, [jobs, applicants]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Welcome to your Guest Dashboard</CardTitle>
                    <CardDescription>
                        Here you can see the status of your job postings and view applicants.
                    </CardDescription>
                </CardHeader>
            </Card>
            
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Job Postings</CardTitle>
                        <CardDescription>Manage your active and pending job posts.</CardDescription>
                    </div>
                     <AddGuestJobDialog>
                        <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Post New Job
                        </Button>
                    </AddGuestJobDialog>
                </CardHeader>
                <CardContent>
                    {jobsWithStats.length > 0 ? (
                        <div className="space-y-4">
                            {jobsWithStats.map(job => (
                                <Card key={job.id}>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>{job.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-4 pt-2">
                                                 <Badge variant={job.status === 'Approved' ? 'default' : 'secondary'}>
                                                    {job.status}
                                                 </Badge>
                                                 <span className="flex items-center gap-1 text-sm">
                                                    <Eye className="h-4 w-4" /> {job.views} view(s)
                                                 </span>
                                                 <span className="flex items-center gap-1 text-sm">
                                                    <Users className="h-4 w-4" /> {job.applicantCount} applicant(s)
                                                 </span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/jobs/${job.id}?companyId=${job.companyId}`} target="_blank">
                                                    <ExternalLink className="mr-2 h-4 w-4" /> View Live Post
                                                </Link>
                                            </Button>
                                             <Button 
                                                size="sm" 
                                                onClick={() => router.push(`/guest-employer/jobs/${job.id}`)}
                                                disabled={job.status !== 'Approved'}
                                            >
                                                View Applicants
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                            <Briefcase className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
                             <AddGuestJobDialog>
                                <Button variant="link">
                                    Post Your First Job
                                </Button>
                            </AddGuestJobDialog>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle>Unlock Full Potential</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        Upgrade to a full account to manage onboarding, payroll, leave, and more.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="secondary" asChild>
                        <Link href="/signup">
                            Create Full Account
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
