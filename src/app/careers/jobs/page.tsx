// src/app/careers/jobs/page.tsx
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
import { ApplicantForm } from '../components/applicant-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

const JobListContent = () => {
    const [vacancies, setVacancies] = useState<EnrichedJobVacancy[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [jobTypes, setJobTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedJobType, setSelectedJobType] = useState('all');

    useEffect(() => {
        const fetchVacancies = async () => {
            setLoading(true);
            try {
                const companiesSnapshot = await get(ref(db, 'companies'));
                const companiesData: { [key: string]: Company } = companiesSnapshot.val();

                if (!companiesData) {
                    setVacancies([]); 
                    setLoading(false); 
                    return;
                }
                
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
            <div className="bg-primary text-primary-foreground p-6">
                <h1 className="text-3xl font-bold">Find the role that's right for you</h1>
                <p className="text-primary-foreground/80 mt-2">CAREERS AT VERTICALSYNC</p>
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
                    </ScrollArea>
            </div>
        </>
    );
};

export default function JobListPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <Button variant="ghost" asChild>
                        <Link href="/careers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Careers
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex flex-col">
                <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>}>
                    <JobListContent />
                </Suspense>
            </main>
        </div>
    );
}
