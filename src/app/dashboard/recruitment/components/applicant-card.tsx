// src/app/dashboard/recruitment/components/applicant-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, JobVacancy, Department } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ApplicantProfile } from './applicant-profile';


interface ApplicantCardProps {
    applicant: Applicant;
    vacancy: JobVacancy;
    departments: Department[];
}

export function ApplicantCard({ applicant, vacancy, departments }: ApplicantCardProps) {
    const nameInitial = applicant.name.split(' ').map(n => n[0]).join('');

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://avatar.vercel.sh/${applicant.email}.png`} alt={applicant.name} />
                                <AvatarFallback>{nameInitial}</AvatarFallback>
                            </Avatar>
                             <div>
                                <CardTitle className="text-base">{applicant.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg p-0">
                <ApplicantProfile applicant={applicant} vacancy={vacancy} departments={departments} />
            </SheetContent>
        </Sheet>
    );
}