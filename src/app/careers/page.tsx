// src/app/careers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { JobVacancy } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';

export default function CareersPage() {
    const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const jobsQuery = query(ref(db, 'jobVacancies'), orderByChild('status'), equalTo('Open'));
        const unsubscribe = onValue(jobsQuery, (snapshot) => {
            const data = snapshot.val();
            const list: JobVacancy[] = data ? Object.values(data) : [];
            list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setVacancies(list);
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Logo />
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12">
                <div className="container">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Join Our Team</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            We're looking for passionate people to join us on our mission. Explore our open roles below.
                        </p>
                    </div>

                    {loading ? (
                         <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="mx-auto max-w-3xl space-y-4">
                           {vacancies.length > 0 ? (
                                vacancies.map((job) => (
                                    <Card key={job.id}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>{job.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 pt-2">
                                                     <Building2 className="h-4 w-4" />
                                                    {job.departmentName}
                                                </CardDescription>
                                            </div>
                                            <Button asChild>
                                                <Link href={`/jobs/${job.id}`}>
                                                    View & Apply
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                ))
                           ) : (
                             <Card>
                                <CardContent className="py-12 text-center">
                                    <h3 className="text-lg font-semibold">No Open Positions</h3>
                                    <p className="text-muted-foreground">
                                        We are not actively hiring at the moment. Please check back later!
                                    </p>
                                </CardContent>
                            </Card>
                           )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
