// src/app/super-admin/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '../auth-provider';
import type { Company, Employee } from '@/lib/data';
import { DataTable } from './components/data-table';
import { columns, type EnrichedCompany } from './components/columns';
import { AddSuperAdminDialog } from './components/add-super-admin-dialog';
import { Button } from '@/components/ui/button';

export default function SuperAdminPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        let companiesLoaded = false;
        let employeesLoaded = false;
        
        const checkLoading = () => {
            if (companiesLoaded && employeesLoaded) {
                setLoadingData(false);
            }
        };

        const companiesUnsubscribe = onValue(ref(db, 'companies'), (snapshot) => {
            setCompanies(snapshot.val() ? Object.values(snapshot.val()) : []);
            companiesLoaded = true; checkLoading();
        });

        const employeesUnsubscribe = onValue(ref(db, 'employees'), (snapshot) => {
            setAllEmployees(snapshot.val() ? Object.values(snapshot.val()) : []);
            employeesLoaded = true; checkLoading();
        });

        return () => {
            companiesUnsubscribe();
            employeesUnsubscribe();
        };
    }, []);

    const enrichedCompanies = useMemo((): EnrichedCompany[] => {
        return companies.map(company => {
            const employeeCount = allEmployees.filter(emp => emp.companyId === company.id).length;
            return { ...company, employeeCount };
        });
    }, [companies, allEmployees]);

    if (authLoading || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!employee || employee.role !== 'Super Admin') return null;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Logo />
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{companies.length}</div>
                            <p className="text-xs text-muted-foreground">
                                companies registered
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{allEmployees.length}</div>
                            <p className="text-xs text-muted-foreground">
                                across all companies
                            </p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Company Management</CardTitle>
                            <CardDescription>
                                A list of all companies registered on the platform.
                            </CardDescription>
                        </div>
                        <AddSuperAdminDialog>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Super Admin
                                </span>
                            </Button>
                        </AddSuperAdminDialog>
                    </CardHeader>
                    <CardContent>
                         <DataTable columns={columns} data={enrichedCompanies} />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
