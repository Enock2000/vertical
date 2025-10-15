// src/app/careers/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense, forwardRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { JobVacancy, Company } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Building2, MapPin, Briefcase, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ApplicantForm } from './components/applicant-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EnrichedJobVacancy = JobVacancy & { companyName: string };

const CareersContent = forwardRef<HTMLDivElement>((props, ref) => {
    const { user } = useAuth();
    const [vacancies, setVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedJob, setSelectedJob] = useState<EnrichedJobVacancy | null>(null);

    useEffect(() => {
        const fetchVacancies = async () => {
            setLoading(true);
            try {
                const companiesSnapshot = await get(ref(db, 'companies'));
                const companiesData: { [key: string]: Company } = companiesSnapshot.val();

                if (!companiesData) {
                    setVacancies([]); setLoading(false); return;
                }

                let allVacancies: EnrichedJobVacancy[] = [];
                const allDepartments = new Set<string>();
                const allLocations = new Set<string>();

                for (const companyId in companiesData) {
                    const company = companiesData[companyId];
                    if (company.status === 'Active' || (company.status === 'Guest' && company.jobVacancies)) {
                        const jobsData = company.jobVacancies || {};
                        Object.values(jobsData).forEach(job => {
                             if ((company.status === 'Active' && job.status === 'Open') || (company.status === 'Guest' && job.status === 'Approved')) {
                                allVacancies.push({ ...job, companyId, companyName: company.name });
                                if (job.departmentName) allDepartments.add(job.departmentName);
                                if (job.location) allLocations.add(job.location);
                            }
                        });
                    }
                }
                
                allVacancies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setVacancies(allVacancies);
                setDepartments(Array.from(allDepartments).sort());
                setLocations(Array.from(allLocations).sort());
            } catch (error) {
                console.error("Firebase read failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVacancies();
    }, []);
    
    const handleScrollToJobs = () => {
        const jobsSection = document.getElementById('job-listings');
        jobsSection?.scrollIntoView({ behavior: 'smooth' });
    };

    const filteredVacancies = vacancies.filter(job => 
        (job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedDept === 'all' || job.departmentName === selectedDept) &&
        (selectedLocation === 'all' || job.location === selectedLocation)
    );
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', minimumFractionDigits: 0 });

    return (
        <>
            <div ref={ref} className="space-y-8">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Connecting top talent with vertical opportunities</h1>
                 </div>
                
                 <Tabs defaultValue="find-jobs" className="w-full max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="find-jobs">Find jobs</TabsTrigger>
                        <TabsTrigger value="post-job" asChild>
                            <Link href="/post-a-job">Post a job</Link>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="find-jobs" className="pt-6">
                         <div className="search-container space-y-4">
                            <div className="relative">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    type="text" 
                                    placeholder="Search jobs by title, skills, or company" 
                                    className="search-input w-full h-12 pl-12"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="open-roles-container text-center">
                                <Button className="open-roles-button" onClick={handleScrollToJobs}>View Open Roles</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                
                <div className="trusted-by text-center space-y-4">
                    <p className="trusted-text text-sm text-muted-foreground">Trusted by leading companies</p>
                    <div className="flex justify-center items-center gap-8">
                         <p className="font-semibold text-muted-foreground">Microsoft</p>
                         <p className="font-semibold text-muted-foreground">Airbnb</p>
                         <p className="font-semibold text-muted-foreground">Company</p>
                         <p className="font-semibold text-muted-foreground">Glassdoor</p>
                    </div>
                </div>

                <div id="job-listings" className="mx-auto max-w-5xl pt-12">
                     {loading ? (
                        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="mx-auto max-w-5xl grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredVacancies.length > 0 ? (
                                filteredVacancies.map((job) => (
                                    <Card key={job.id} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle>{job.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 pt-2">
                                                <Building2 className="h-4 w-4" />
                                                {job.companyName}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location || 'Not specified'}</p>
                                            <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.jobType || 'Not specified'}</p>
                                            {job.salary && <p className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> {currencyFormatter.format(job.salary)}</p>}
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => setSelectedJob(job)}>Apply Now</Button>
                                        </CardFooter>
                                    </Card>
                                ))
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className="py-12 text-center">
                                    <h3 className="text-lg font-semibold">No Matching Positions</h3>
                                    <p className="text-muted-foreground">
                                        Your search returned no results. Try adjusting your filters.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                        {!user && (
                                <div className="col-span-full text-center text-sm text-muted-foreground pt-4">
                                    <Link href="/applicant-signup" className="underline text-primary">
                                        Create an applicant profile
                                    </Link>
                                    {' '}to apply easily.
                                </div>
                        )}
                        </div>
                    )}
                </div>
            </div>
             <Dialog open={!!selectedJob} onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                         <DialogDescription>
                            Submit your application for the role at {selectedJob?.companyName}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedJob && <ApplicantForm job={selectedJob} onSubmitted={() => setSelectedJob(null)} />}
                </DialogContent>
            </Dialog>
        </>
    );
});
CareersContent.displayName = "CareersContent";


export default function CareersPage() {
    const { user } = useAuth();
    const jobListingsRef = useCallback((node: HTMLDivElement) => {
        if (node) {
            // Optional: You could use this ref to auto-scroll if you want
        }
    }, []);

     return (
        <div className="flex min-h-screen flex-col bg-background">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                         <Button asChild variant={user ? "secondary" : "default"}>
                             <Link href={user ? (user.isAnonymous ? "/signup" : "/applicant-portal") : "/employee-login"}>
                                {user ? 'Go to Portal' : 'Portal Login'}
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 py-12 md:py-20">
                <div className="container">
                    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                        <CareersContent ref={jobListingsRef} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
