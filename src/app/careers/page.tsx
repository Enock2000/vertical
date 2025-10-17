// src/app/careers/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { JobVacancy, Company } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Building2, MapPin, Briefcase, DollarSign, X, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ApplicantForm } from './components/applicant-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

const CareersContent = () => {
    const { user } = useAuth();
    const [vacancies, setVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [jobTypes, setJobTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedJobType, setSelectedJobType] = useState('all');
    const [isJobListOpen, setIsJobListOpen] = useState(false);

    useEffect(() => {
        const fetchVacancies = async () => {
            setLoading(true);
            try {
                const companiesSnapshot = await get(ref(db, 'companies'));
                const companiesData: { [key: string]: Company } = companiesSnapshot.val();

                if (!companiesData) {
                    setVacancies([]); 
                    setCompanies([]);
                    setLoading(false); 
                    return;
                }
                
                const allCompanies = Object.values(companiesData);
                setCompanies(allCompanies.filter(c => c.status === 'Active'));

                let allVacancies: EnrichedJobVacancy[] = [];
                const allDepartments = new Set<string>();
                const allLocations = new Set<string>();
                const allJobTypes = new Set<string>();

                for (const companyId in companiesData) {
                    const company = companiesData[companyId];
                    if (company.status === 'Active' || (company.status === 'Guest' && company.jobVacancies)) {
                        const jobsData = company.jobVacancies || {};
                        Object.values(jobsData).forEach(job => {
                             if ((company.status === 'Active' && job.status === 'Open') || (company.status === 'Guest' && job.status === 'Approved')) {
                                allVacancies.push({ ...job, companyId, companyName: company.name });
                                if (job.departmentName) allDepartments.add(job.departmentName);
                                if (job.location) allLocations.add(job.location);
                                if (job.jobType) allJobTypes.add(job.jobType);
                            }
                        });
                    }
                }
                
                allVacancies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setVacancies(allVacancies);
                setDepartments(Array.from(allDepartments).sort());
                setLocations(Array.from(allLocations).sort());
                setJobTypes(Array.from(allJobTypes).sort());

            } catch (error) {
                console.error("Firebase read failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVacancies();
    }, []);

    const filteredVacancies = vacancies.filter(job => 
        (job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedDept === 'all' || job.departmentName === selectedDept) &&
        (selectedLocation === 'all' || job.location === selectedLocation) &&
        (selectedJobType === 'all' || job.jobType === selectedJobType)
    );
    
    const clearFilters = () => {
        setSelectedDept('all');
        setSelectedLocation('all');
        setSelectedJobType('all');
    }

    return (
        <>
            <section className="relative w-full text-center text-white py-20 md:py-28 flex items-center justify-center">
                 <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop"
                    alt="People working in an office"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="office meeting"
                />
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                 <div className="relative z-20 container">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Connecting top talent with vertical opportunities</h1>
                    <Tabs defaultValue="find-jobs" className="w-full max-w-xl mx-auto mt-8">
                        <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm">
                            <TabsTrigger value="find-jobs" className="text-white data-[state=active]:bg-white/90 data-[state=active]:text-gray-900">Find jobs</TabsTrigger>
                            <TabsTrigger value="post-job" asChild>
                                <Link href="/post-a-job" className="text-white">Post a job</Link>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="find-jobs" className="pt-6">
                            <div className="search-container space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        type="text" 
                                        placeholder="Search jobs by title, skills, or company" 
                                        className="search-input w-full h-12 pl-12 bg-white text-gray-900"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="open-roles-container text-center">
                                    <Button className="open-roles-button h-12" onClick={() => setIsJobListOpen(true)}>View Open Roles</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                 </div>
            </section>
            
            <section className="bg-background">
                <div className="container py-4 md:py-6 space-y-4">
                     <div className="trusted-by text-center space-y-2">
                        <p className="trusted-text text-sm text-muted-foreground">Trusted by leading companies</p>
                        <div className="flex justify-center items-center gap-8 flex-wrap">
                            {companies.slice(0, 4).map(company => (
                                <p key={company.id} className="font-semibold text-muted-foreground">{company.name}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Dialog open={isJobListOpen} onOpenChange={setIsJobListOpen}>
                <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 gap-0 sm:rounded-none">
                    <div className="bg-primary text-primary-foreground p-6">
                        <DialogTitle className="text-3xl">Find the role that's right for you</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 mt-2">CAREERS AT VERTICALSYNC</DialogDescription>
                    </div>
                    <div className="p-6 flex flex-wrap items-center gap-4 border-b">
                        <span className="text-sm font-medium">Filter by</span>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Team" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Employment Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {jobTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="link" onClick={clearFilters} className="ml-auto">Clear all</Button>
                    </div>
                     <div className="p-6 flex-1 overflow-hidden">
                        <h3 className="font-semibold mb-4">Open positions ({filteredVacancies.length})</h3>
                         <ScrollArea className="h-full">
                             {loading ? (
                                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredVacancies.length > 0 ? (
                                        filteredVacancies.map((job) => (
                                            <Card key={job.id} className="flex flex-col">
                                                <CardHeader>
                                                    <CardTitle className="text-base">{job.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                                                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location || 'Not specified'}</p>
                                                    <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.departmentName}</p>
                                                    <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.jobType || 'Not specified'}</p>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button variant="outline" className="w-full justify-between" asChild>
                                                        <Link href={`/jobs/${job.id}?companyId=${job.companyId}`}>
                                                            View Overview
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))
                                ) : (
                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                        <p>No matching positions found.</p>
                                    </div>
                                )}
                                </div>
                            )}
                         </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};


export default function CareersPage() {
    const { user } = useAuth();
    
     return (
        <div className="flex min-h-screen flex-col bg-background">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <div className="flex items-center gap-4">
                         <Button asChild variant={user ? "secondary" : "default"}>
                             <Link href={user ? (user.isAnonymous ? "/signup" : "/applicant-portal") : "/employee-login"}>
                                {user ? 'Go to Portal' : 'Portal Login'}
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main>
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                    <CareersContent/>
                </Suspense>
            </main>
        </div>
    );
}
