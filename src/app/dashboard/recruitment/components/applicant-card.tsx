// src/app/dashboard/recruitment/components/applicant-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, JobVacancy, Department, ApplicantStatus, OnboardingTask } from '@/lib/data';
import { defaultOnboardingTasks } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ApplicantProfile } from './applicant-profile';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { ref, update, push } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';

const statusOptions: ApplicantStatus[] = ['Screening', 'Interview', 'Offer', 'Onboarding', 'Hired'];

interface ApplicantCardProps {
    applicant: Applicant;
    vacancy: JobVacancy;
    departments: Department[];
}

export function ApplicantCard({ applicant, vacancy, departments }: ApplicantCardProps) {
    const nameInitial = applicant.name.split(' ').map(n => n[0]).join('');
    const { companyId } = useAuth();
    const { toast } = useToast();
    
    const handleStatusChange = async (status: ApplicantStatus) => {
        if (!companyId) return;
        try {
            const updates: { [key: string]: any } = { status };
            if (status === 'Onboarding' && !applicant.onboardingTasks) {
                const initialTasks: OnboardingTask[] = defaultOnboardingTasks.map(task => ({
                    id: push(ref(db)).key!,
                    title: task.title,
                    completed: false,
                    dueDate: null,
                }));
                updates['onboardingTasks'] = initialTasks;
            }
             if (status === 'Hired' || status === 'Accepted') {
                updates['hiredAt'] = new Date().toISOString();
            }

            await update(ref(db, `companies/${companyId}/applicants/${applicant.id}`), updates);
            toast({
                title: "Status Updated",
                description: `${applicant.name}'s status has been changed to "${status}".`,
            });
        } catch (error) {
            console.error(`Failed to update status to ${status}`, error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update applicant status.",
            });
        }
    };


    return (
        <Sheet>
            <Card className="hover:bg-muted/80">
                <CardHeader>
                    <div className="flex items-start justify-between">
                         <SheetTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer flex-1">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://avatar.vercel.sh/${applicant.email}.png`} alt={applicant.name} />
                                    <AvatarFallback>{nameInitial}</AvatarFallback>
                                </Avatar>
                                 <div>
                                    <CardTitle className="text-base">{applicant.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</p>
                                </div>
                            </div>
                        </SheetTrigger>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {statusOptions.map(status => (
                                     <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)}>
                                        Move to {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
            </Card>
             <SheetContent className="sm:max-w-lg p-0">
                <ApplicantProfile applicant={applicant} vacancy={vacancy} departments={departments} />
            </SheetContent>
        </Sheet>
    );
}
