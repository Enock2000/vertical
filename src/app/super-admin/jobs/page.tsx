// src/app/super-admin/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import type { JobVacancy } from '@/lib/data';
import { DataTable } from './components/data-table';
import { columns, type EnrichedJob } from './components/columns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SuperAdminJobsPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allJobs, setAllJobs] = useState<EnrichedJob[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [rowSelection, setRowSelection] = useState({});

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        const companiesRef = ref(db, 'companies');
        const unsubscribe = onValue(companiesRef, (snapshot) => {
            const companiesData = snapshot.val();
            const jobsList: EnrichedJob[] = [];
            if (companiesData) {
                Object.values(companiesData).forEach((company: any) => {
                    if (company.jobVacancies) {
                        Object.values(company.jobVacancies).forEach((job: any) => {
                            jobsList.push({
                                ...job,
                                companyName: company.name,
                                // Make sure companyId is passed for delete actions
                                companyId: company.id, 
                            });
                        });
                    }
                });
            }
            jobsList.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAllJobs(jobsList);
            setLoadingData(false);
        }, (error) => {
            console.error(error);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (jobsToDelete: EnrichedJob[]) => {
        if (jobsToDelete.length === 0) return;
        try {
            const deletePromises = jobsToDelete.map(job => 
                remove(ref(db, `companies/${job.companyId}/jobVacancies/${job.id}`))
            );
            await Promise.all(deletePromises);
            toast({
                title: `${jobsToDelete.length} Job(s) Deleted`,
                description: "The selected job postings have been removed.",
            });
             setRowSelection({}); // Clear selection after delete
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: "Could not delete the selected jobs.",
            });
        }
    };


    if (authLoading || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!employee || employee.role !== 'Super Admin') return null;

    const tableColumns = columns(handleDelete);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                             <div className='flex items-center gap-4'>
                                <Button variant="outline" size="icon" onClick={() => router.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle>All Job Vacancies</CardTitle>
                                    <CardDescription>
                                        A list of all jobs posted across the platform.
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <DataTable 
                            columns={tableColumns} 
                            data={allJobs}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                            onDeleteSelected={handleDelete}
                         />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
