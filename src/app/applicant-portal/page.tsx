
// src/app/applicant-portal/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Applicant, JobVacancy, Company } from '@/lib/data';
import { Loader2, Briefcase, Building2, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleApplication } from '@/ai/flows/handle-application-flow';
import { Separator } from '@/components/ui/separator';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

export default function ApplicantPortalPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [applications, setApplications] = useState<(Applicant & { jobTitle?: string; companyName?: string })[]>([]);
    const [openVacancies, setOpenVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
             if (!authLoading) setLoadingData(false);
            return;
        }
        
        let appsLoaded = false;
        let jobsLoaded = false;
        const checkLoading = () => {
            if (appsLoaded && jobsLoaded) setLoadingData(false);
        }

        // Fetch user's applications
        const companiesRef = ref(db, 'companies');
        const unsubscribeApps = onValue(companiesRef, async (snapshot) => {
            const companiesData = snapshot.val();
            if (companiesData) {
                const userApplications: (Applicant & { jobTitle?: string; companyName?: string })[] = [];
                for (const companyId in companiesData) {
                    const company = companiesData[companyId];
                    const companyApplicants = company.applicants || {};
                    for(const applicantId in companyApplicants) {
                        const applicant = companyApplicants[applicantId];
                        if(applicant.userId === user.uid) {
                            const job = company.jobVacancies?.[applicant.jobVacancyId];
                            userApplications.push({
                                ...applicant,
                                jobTitle: job?.title || 'Unknown Job',
                                companyName: company.name
                            });
                        }
                    }
                }
                setApplications(userApplications.sort((a,b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
            }
            appsLoaded = true;
            checkLoading();
        });
        
        // Fetch all open jobs
        const unsubscribeJobs = onValue(companiesRef, (snapshot) => {
            const companiesData = snapshot.val();
            if (!companiesData) {
                jobsLoaded = true;
                checkLoading();
                return;
            }
            const allVacancies: EnrichedJobVacancy[] = [];
            for (const companyId in companiesData) {
                const company = companiesData[companyId];
                if (company.status === 'Active' || company.status === 'Guest') {
                    const jobsData = company.jobVacancies;
                    if (jobsData) {
                        Object.keys(jobsData).forEach(jobId => {
                            const job = jobsData[jobId];
                            if ((company.status === 'Active' && job.status === 'Open') || (company.status === 'Guest' && job.status === 'Approved')) {
                                allVacancies.push({ ...job, id: jobId, companyId: companyId, companyName: company.name });
                            }
                        });
                    }
                }
            }
            setOpenVacancies(allVacancies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            jobsLoaded = true;
            checkLoading();
        });


        return () => {
            unsubscribeApps();
            unsubscribeJobs();
        };
    }, [user, authLoading]);

    const handleQuickApply = useCallback(async (job: EnrichedJobVacancy) => {
        if (!employee || !user) return;
        setSubmittingJobId(job.id);

        const formData = new FormData();
        formData.append('companyId', job.companyId);
        formData.append('jobVacancyId', job.id);
        formData.append('vacancyTitle', job.title);
        formData.append('name', employee.name);
        formData.append('email', employee.email);
        if (employee.phone) {
            formData.append('phone', employee.phone);
        }
        // No need to append resume file; backend will find existing URL.

        try {
            const result = await handleApplication(formData);
            if (result.success) {
                toast({
                    title: "Application Submitted!",
                    description: `Your application for ${job.title} was successful.`,
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Application Failed",
                    description: result.message,
                });
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setSubmittingJobId(null);
        }
    }, [employee, user, toast]);

    const appliedJobIds = useMemo(() => new Set(applications.map(app => app.jobVacancyId)), [applications]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
     if (!employee) return null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {employee.name}</CardTitle>
                    <CardDescription>
                        Here you can track your job applications and explore new opportunities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Date Applied</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                                        <TableCell>{app.companyName}</TableCell>
                                        <TableCell>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</TableCell>
                                        <TableCell><Badge variant="outline">{app.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-center">
                            <Briefcase className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">You haven't applied for any jobs yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Open Positions</CardTitle>
                    <CardDescription>
                        Apply to open positions with a single click.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {openVacancies.length > 0 ? (
                        <div className="space-y-4">
                            {openVacancies.map(job => (
                                <div key={job.id} className="border p-4 rounded-lg">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-semibold">{job.title}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Building2 className="h-4 w-4" /> {job.companyName}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {appliedJobIds.has(job.id) ? (
                                                <Button disabled variant="secondary" size="sm">
                                                    <CheckCircle className="mr-2 h-4 w-4"/>
                                                    Applied
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleQuickApply(job)}
                                                    disabled={submittingJobId === job.id}
                                                >
                                                    {submittingJobId === job.id ? 
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                                        <Upload className="mr-2 h-4 w-4" />
                                                    }
                                                    Quick Apply
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-40 text-center">
                            <p className="text-muted-foreground">There are no open positions at the moment.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
