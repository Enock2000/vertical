// src/app/careers/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { Company, JobVacancy } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ArrowLeft, Building2, MapPin, Briefcase, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

const CareersContent = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [vacancies, setVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        const fetchCompaniesAndVacancies = async () => {
            setLoading(true);
            try {
                const companiesSnapshot = await get(ref(db, 'companies'));
                const companiesData: { [key: string]: Company } = companiesSnapshot.val();

                if (!companiesData) {
                    setCompanies([]);
                    setVacancies([]);
                    setLoading(false); 
                    return;
                }
                
                const allCompanies = Object.values(companiesData);
                setCompanies(allCompanies.filter(c => c.status === 'Active' && c.logoUrl));

                let allVacancies: EnrichedJobVacancy[] = [];
                 for (const companyId in companiesData) {
                    const company = companiesData[companyId];
                    if (company.status === 'Active' || (company.status === 'Guest' && company.jobVacancies)) {
                        const jobsData = company.jobVacancies || {};
                        Object.values(jobsData).forEach(job => {
                             if ((company.status === 'Active' && job.status === 'Open') || (company.status === 'Guest' && job.status === 'Approved')) {
                                allVacancies.push({ ...job, companyId, companyName: company.name });
                            }
                        });
                    }
                }
                allVacancies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setVacancies(allVacancies);

            } catch (error) {
                console.error("Firebase read failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompaniesAndVacancies();
    }, []);

    const filteredVacancies = useMemo(() => {
        if (!searchTerm) {
            return vacancies.slice(0, 6); // Show first 6 jobs if no search term
        }
        return vacancies.filter(job => 
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, vacancies]);

    const repeatedCompanies = companies.length > 0 ? [...companies, ...companies] : [];

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
                            </div>
                        </TabsContent>
                    </Tabs>
                 </div>
            </section>
            
            <section className="bg-background py-16">
                <div className="container space-y-8">
                    {searchTerm && (
                        <h2 className="text-2xl font-bold">Search Results for "{searchTerm}"</h2>
                    )}
                     {loading ? (
                        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredVacancies.length > 0 ? (
                                filteredVacancies.map((job) => (
                                    <Card key={job.id} className="flex flex-col transition-transform duration-300 ease-in-out hover:scale-105 border-t-4 border-primary">
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-base">{job.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground pt-0">
                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location || 'Not specified'}</p>
                                            <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.departmentName}</p>
                                            <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {job.jobType || 'Not specified'}</p>
                                        </CardContent>
                                        <CardFooter className="pt-2">
                                            <Button variant="outline" className="w-full justify-between" asChild>
                                                <Link href={`/jobs/${job.id}?companyId=${job.companyId}`}>
                                                    Overview
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
                     <div className="text-center mt-8">
                        <Button asChild>
                            <Link href="/careers/jobs">View All Jobs</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="bg-muted/50">
                <div className="container py-4 md:py-6 space-y-4">
                     <div className="trusted-by text-center space-y-2">
                        <p className="trusted-text text-sm text-muted-foreground">Trusted by leading companies</p>
                        {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                             <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                                <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-scroll">
                                    {repeatedCompanies.map((company, index) => (
                                        <li key={`${company.id}-${index}`}>
                                            <Logo companyName={company.name} logoUrl={company.logoUrl} />
                                        </li>
                                    ))}
                                </ul>
                                <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-scroll" aria-hidden="true">
                                     {repeatedCompanies.map((company, index) => (
                                        <li key={`${company.id}-${index}-clone`}>
                                            <Logo companyName={company.name} logoUrl={company.logoUrl} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>
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
