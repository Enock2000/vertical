// src/app/dashboard/recruitment/components/applicant-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, JobVacancy, Department, OnboardingTask, Employee } from '@/lib/data';
import { defaultOnboardingTasks } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ApplicantProfile } from './applicant-profile';
import { MoreHorizontal, XCircle, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { db, auth } from '@/lib/firebase';
import { ref, update, push, get, set } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { RejectApplicantDialog } from './reject-applicant-dialog';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusOptions: ApplicantStatus[] = ['Screening', 'Interview', 'Offer', 'Onboarding'];

interface ApplicantCardProps {
    applicant: Applicant;
    vacancy: JobVacancy;
    departments: Department[];
}

export function ApplicantCard({ applicant, vacancy, departments }: ApplicantCardProps) {
    const nameInitial = applicant.name.split(' ').map(n => n[0]).join('');
    const { company, companyId } = useAuth();
    const { toast } = useToast();
    const [isHireConfirmOpen, setIsHireConfirmOpen] = useState(false);
    
    const handleStatusChange = async (status: ApplicantStatus) => {
        if (!companyId || !company) return;
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

            await update(ref(db, `companies/${companyId}/applicants/${applicant.id}`), updates);
            
            toast({
                title: "Status Updated",
                description: `${applicant.name}'s status has been changed to "${status}".`,
            });

        } catch (error: any) {
            console.error(`Failed to update status to ${status}`, error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update applicant status.",
            });
        }
    };
    
    const handleHire = async () => {
        if (!companyId || !company) return;
        try {
            // 1. Update applicant status to "Hired"
            await update(ref(db, `companies/${companyId}/applicants/${applicant.id}`), { 
                status: 'Hired',
                hiredAt: new Date().toISOString()
            });
            
            // 2. Find or Create Employee Record
            const employeeRef = ref(db, `employees/${applicant.userId}`);
            const employeeSnap = await get(employeeRef);
            
            const employeeData: Partial<Employee> = {
                id: applicant.userId,
                name: applicant.name,
                email: applicant.email,
                phone: applicant.phone,
                resumeUrl: applicant.resumeUrl,
                companyId: companyId,
                role: vacancy.title,
                status: 'Active',
                departmentId: vacancy.departmentId,
                departmentName: vacancy.departmentName,
                joinDate: new Date().toISOString(),
                avatar: `https://avatar.vercel.sh/${applicant.email}.png`,
            };

            if (employeeSnap.exists()) {
                // User already has a profile, just update it
                await update(employeeRef, employeeData);
            } else {
                // This is a new employee, create a full record
                await set(employeeRef, employeeData);
            }

            // 3. Send password reset/welcome email
            await sendPasswordResetEmail(auth, applicant.email);

            toast({
                title: "Applicant Hired!",
                description: `${applicant.name} is now an employee. An email has been sent for them to set their password and log in.`,
            });

        } catch (error: any) {
            console.error(`Failed to hire applicant`, error);
            toast({
                variant: "destructive",
                title: "Hiring Failed",
                description: error.message || "Could not complete the hiring process.",
            });
        } finally {
            setIsHireConfirmOpen(false);
        }
    };


    return (
        <>
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
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem onSelect={() => setIsHireConfirmOpen(true)} className="text-green-600 focus:text-green-600 focus:bg-green-50">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Hired
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <RejectApplicantDialog applicant={applicant} vacancy={vacancy}>
                                        <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <XCircle className="h-4 w-4" />
                                            Reject Application
                                        </div>
                                    </RejectApplicantDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                </Card>
                <SheetContent className="sm:max-w-lg p-0">
                    <ApplicantProfile applicant={applicant} vacancy={vacancy} departments={departments} />
                </SheetContent>
            </Sheet>
            
            <AlertDialog open={isHireConfirmOpen} onOpenChange={setIsHireConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to hire {applicant.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will convert the applicant to an active employee and send them an email to set their password for the employee portal. This action is final.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleHire}>Confirm & Send Email</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
