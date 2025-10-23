// src/app/careers/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { Company } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

const CareersContent = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            try {
                const companiesSnapshot = await get(ref(db, 'companies'));
                const companiesData: { [key: string]: Company } = companiesSnapshot.val();

                if (!companiesData) {
                    setCompanies([]);
                    setLoading(false); 
                    return;
                }
                
                const allCompanies = Object.values(companiesData);
                setCompanies(allCompanies.filter(c => c.status === 'Active' && c.logoUrl));

            } catch (error) {
                console.error("Firebase read failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

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
                                <div className="open-roles-container text-center">
                                    <Button className="open-roles-button h-12" asChild>
                                        <Link href={`/careers/jobs?q=${encodeURIComponent(searchTerm)}`}>View Open Roles</Link>
                                    </Button>
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
