// src/app/guest-employer/jobs/[jobId]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { JobVacancy, Applicant } from '@/lib/data';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/app/dashboard/recruitment/components/data-table';
import { columns as applicantColumns } from '@/app/dashboard/recruitment/components/columns';

export default function GuestJobApplicantsPage() {
    const { user, companyId, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const jobId = params.jobId as string;

    const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!companyId || !jobId) {
            if (!authLoading) setLoadingData(false);
            return;
        }

        let jobLoaded = false;
        let applicantsLoaded = false;
        const checkLoading = () => {
            if (jobLoaded && applicantsLoaded) setLoadingData(false);
        };

        const jobRef = ref(db, `companies/${companyId}/jobVacancies/${jobId}`);
        const jobUnsubscribe = onValue(jobRef, (snapshot) => {
            setVacancy(snapshot.val());
            jobLoaded = true;
            checkLoading();
        }, () => { jobLoaded = true; checkLoading(); });
        
        const applicantsRef = ref(db, `companies/${companyId}/applicants`);
        const applicantsUnsubscribe = onValue(applicantsRef, (snapshot) => {
            const allApplicants: Record<string, Applicant> = snapshot.val();
            if (allApplicants) {
                const jobApplicants = Object.values(allApplicants).filter(app => app.jobVacancyId === jobId);
                setApplicants(jobApplicants);
            }
            applicantsLoaded = true;
            checkLoading();
        }, () => { applicantsLoaded = true; checkLoading(); });


        return () => {
            jobUnsubscribe();
            applicantsUnsubscribe();
        };

    }, [companyId, jobId, authLoading]);

    const tableColumns = useMemo(() => {
        if (!vacancy) return [];
        return applicantColumns(vacancy, []); // Guest employers don't have departments
    }, [vacancy]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!vacancy) {
        return <p className="text-center text-muted-foreground">Job not found.</p>
    }

    return (
        <Card>
            <CardHeader>
                 <div className='flex items-center justify-between'>
                     <div className='flex items-center gap-4'>
                        <Button variant="outline" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Applicants for: {vacancy.title}</CardTitle>
                            <CardDescription>
                                {applicants.length} candidate(s) have applied for this position.
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <DataTable columns={tableColumns} data={applicants} />
            </CardContent>
        </Card>
    );
}
