// src/app/applicant-portal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Applicant, JobVacancy, Company } from '@/lib/data';
import { Loader2, Briefcase } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ApplicantPortalPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<(Applicant & { jobTitle?: string; companyName?: string })[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user) {
            // Because applicants are spread across companies, we need to fetch all and filter
            const companiesRef = ref(db, 'companies');
            const unsubscribe = onValue(companiesRef, async (snapshot) => {
                const companiesData = snapshot.val();
                if (companiesData) {
                    const userApplications: (Applicant & { jobTitle?: string; companyName?: string })[] = [];
                    for (const companyId in companiesData) {
                        const company = companiesData[companyId];
                        const companyApplicants = company.applicants || {};
                        for(const applicantId in companyApplicants) {
                            const applicant = companyApplicants[applicantId];
                             // The unique ID check
                             const applicantUserId = `applicant_${Buffer.from(applicant.email).toString('base64').replace(/=/g, '')}`;
                            if(applicant.userId === user.uid || applicantUserId === user.uid) {
                                const job = company.jobVacancies?.[applicant.jobVacancyId];
                                userApplications.push({
                                    ...applicant,
                                    jobTitle: job?.title || 'Unknown Job',
                                    companyName: company.name
                                });
                            }
                        }
                    }
                    setApplications(userApplications.sort((a,b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
                }
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed:", error);
                setLoadingData(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [user, authLoading]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
     if (!employee) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, {employee.name}</CardTitle>
                <CardDescription>
                    Here you can track the status of your job applications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {applications.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Date Applied</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">{app.jobTitle}</TableCell>
                                    <TableCell>{app.companyName}</TableCell>
                                    <TableCell>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell><Badge variant="outline">{app.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                     <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                        <Briefcase className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">You haven't applied for any jobs yet.</p>
                         <Button asChild variant="link">
                            <Link href="/careers">
                                View Open Positions
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
