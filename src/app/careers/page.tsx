// src/app/careers/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { JobVacancy, Company, Applicant } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Building2, Search, CheckCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { handleApplication } from '@/ai/flows/handle-application-flow';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

export default function CareersPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [vacancies, setVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [userApplications, setUserApplications] = useState<Applicant[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('all');
    const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);

    useEffect(() => {
        const fetchVacancies = async () => {
            setLoading(true);
            const companiesRef = ref(db, 'companies');
            const companiesSnapshot = await get(companiesRef);
            const companiesData: { [key: string]: Company } = companiesSnapshot.val();

            if (!companiesData) {
                setVacancies([]);
                setLoading(false);
                return;
            }

            const allVacancies: EnrichedJobVacancy[] = [];
            const allDepartments = new Set<string>();
            
            for (const companyId in companiesData) {
                const company = companiesData[companyId];
                if (company.status === 'Active' || company.status === 'Guest') {
                    const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
                    const jobsSnapshot = await get(jobsRef);
                    const jobsData = jobsSnapshot.val();

                    if (jobsData) {
                        Object.keys(jobsData).forEach(jobId => {
                            const job = jobsData[jobId];
                            if ((company.status === 'Active' && job.status === 'Open') || (company.status === 'Guest' && job.status === 'Approved')) {
                                allVacancies.push({ 
                                    ...job, 
                                    id: jobId, 
                                    companyId: companyId,
                                    companyName: company.name 
                                });
                                if (job.departmentName) allDepartments.add(job.departmentName);
                            }
                        });
                    }
                }
            }
            
            allVacancies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setVacancies(allVacancies);
            setDepartments(Array.from(allDepartments).sort());
            setLoading(false);
        };

        fetchVacancies().catch(error => {
            console.error("Firebase read failed:", error);
            setLoading(false);
        });

    }, []);

    useEffect(() => {
        if (user) {
            const companiesRef = ref(db, 'companies');
            const unsubscribe = onValue(companiesRef, (snapshot) => {
                const companiesData = snapshot.val();
                if (!companiesData) return;
                const apps: Applicant[] = [];
                for (const companyId in companiesData) {
                    const applicants = companiesData[companyId].applicants || {};
                    for (const appId in applicants) {
                        if (applicants[appId].userId === user.uid) {
                            apps.push(applicants[appId]);
                        }
                    }
                }
                setUserApplications(apps);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleQuickApply = useCallback(async (job: EnrichedJobVacancy) => {
        if (!employee || !user) return;
        setSubmittingJobId(job.id);

        const applicationData = {
            companyId: job.companyId,
            jobVacancyId: job.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '',
            source: 'Careers Page Quick Apply',
        };

        try {
            const result = await handleApplication(applicationData);
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

    const hasApplied = (jobId: string) => {
        return userApplications.some(app => app.jobVacancyId === jobId);
    };

    const filteredVacancies = vacancies.filter(job => 
        (job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedDept === 'all' || job.departmentName === selectedDept)
    );

    const isLoggedInApplicant = !authLoading && !!user && !!employee && employee.role === 'Applicant';

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/post-a-job">
                                Post a Job
                            </Link>
                        </Button>
                         <Button variant="secondary" asChild>
                            <Link href="/employee-login">
                                Portal Login
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/">
                                Back to Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 py-12">
                <div className="container">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Available Positions</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            Explore open roles from great companies. Your next opportunity awaits.
                        </p>
                    </div>
                    
                    <div className="mx-auto max-w-4xl mb-8 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by title or company..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                         <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="mx-auto max-w-4xl space-y-4">
                           {filteredVacancies.length > 0 ? (
                                filteredVacancies.map((job) => (
                                    <Card key={job.id}>
                                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <CardTitle>{job.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 pt-2">
                                                     <Building2 className="h-4 w-4" />
                                                    {job.companyName} &middot; {job.departmentName}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/jobs/${job.id}?companyId=${job.companyId}`}>
                                                        View Details
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {isLoggedInApplicant ? (
                                                    hasApplied(job.id) ? (
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
                                                    )
                                                ) : (
                                                    <Button size="sm" asChild>
                                                        <Link href="/employee-login">Log In to Apply</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                           ) : (
                             <Card>
                                <CardContent className="py-12 text-center">
                                    <h3 className="text-lg font-semibold">No Matching Positions</h3>
                                    <p className="text-muted-foreground">
                                        Your search returned no results. Try adjusting your filters.
                                    </p>
                                </CardContent>
                            </Card>
                           )}
                           {!isLoggedInApplicant && (
                                <div className="text-center text-sm text-muted-foreground pt-4">
                                    Don't have an applicant profile?{' '}
                                    <Link href="/applicant-signup" className="underline text-primary">
                                        Create one now
                                    </Link>
                                    {' '}to start applying.
                                </div>
                           )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
