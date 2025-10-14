// src/app/careers/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense, forwardRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { JobVacancy, Company } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Building2, MapPin, Briefcase, DollarSign, ArrowDown, Sparkles, Handshake, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ApplicantForm } from './components/applicant-form';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type EnrichedJobVacancy = JobVacancy & { companyName: string };

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center p-4">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
);


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
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Available Positions</h1>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                        Explore open roles from great companies. Your next opportunity awaits.
                    </p>
                </div>
                
                <Card className="mx-auto max-w-5xl p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by title or company..."
                                className="pl-10 h-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

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
    const jobsSectionRef = useRef<HTMLDivElement>(null);
    const handleScrollToJobs = () => {
        jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

     return (
        <div className="flex min-h-screen flex-col bg-background">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/post-a-job">Post a Job</Link>
                        </Button>
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
            <main className="flex-1">
                 {/* Hero Section */}
                <section className="relative bg-muted/40 py-20 md:py-32">
                     <div className="container relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                                Find Your Next Opportunity
                            </h1>
                            <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground md:text-xl">
                                We partner with innovative companies looking for talented individuals like you. Browse open positions and find a role where you can grow and make an impact.
                            </p>
                            <div className="mt-8 flex justify-center md:justify-start">
                                <Button size="lg" onClick={handleScrollToJobs}>
                                    <ArrowDown className="mr-2 h-5 w-5" />
                                    View Open Roles
                                </Button>
                            </div>
                        </div>
                        <div className="relative h-64 md:h-96">
                            <Image 
                                src={PlaceHolderImages[0].imageUrl} 
                                alt={PlaceHolderImages[0].description} 
                                fill 
                                className="object-cover rounded-lg shadow-xl"
                                data-ai-hint={PlaceHolderImages[0].imageHint}
                            />
                        </div>
                    </div>
                </section>
                
                 {/* Why Join Section */}
                <section className="py-20 md:py-28">
                    <div className="container">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why Join Our Network?</h2>
                            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                                We connect you with companies that value their people and invest in their growth.
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                           <FeatureCard
                                icon={<Sparkles className="h-6 w-6" />}
                                title="Innovative Companies"
                                description="Work with forward-thinking companies that are leaders in their industries."
                            />
                             <FeatureCard
                                icon={<Handshake className="h-6 w-6" />}
                                title="Supportive Cultures"
                                description="Find employers that foster collaboration, respect, and a healthy work-life balance."
                            />
                             <FeatureCard
                                icon={<BrainCircuit className="h-6 w-6" />}
                                title="Growth Opportunities"
                                description="Discover roles with clear paths for professional development and learning."
                            />
                        </div>
                    </div>
                </section>
                
                {/* Job Listings Section */}
                <section ref={jobsSectionRef} className="py-20 md:py-28 bg-muted/40">
                    <div className="container">
                        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                            <CareersContent ref={jobListingsRef} />
                        </Suspense>
                    </div>
                </section>
            </main>
        </div>
    );
}
