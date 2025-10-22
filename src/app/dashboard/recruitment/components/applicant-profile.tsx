// src/app/dashboard/recruitment/components/applicant-profile.tsx
'use client';

import type { Applicant, JobVacancy, Department } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Phone, FileText, Calendar, Info, MessageSquare, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface ApplicantProfileProps {
    applicant: Applicant;
    vacancy: JobVacancy;
    departments: Department[];
}

export function ApplicantProfile({ applicant, vacancy, departments }: ApplicantProfileProps) {
    const nameInitial = applicant.name.split(' ').map(n => n[0]).join('');

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={`https://avatar.vercel.sh/${applicant.email}.png`} alt={applicant.name} />
                        <AvatarFallback className="text-xl">{nameInitial}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold">{applicant.name}</h2>
                        <p className="text-muted-foreground">Applying for: {vacancy.title}</p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Contact Information</h3>
                        <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {applicant.email}</p>
                        <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {applicant.phone || 'Not provided'}</p>
                        {applicant.linkedinProfile && (
                             <p className="flex items-center gap-2 text-sm">
                                <Linkedin className="h-4 w-4 text-muted-foreground" /> 
                                <a href={applicant.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                    LinkedIn Profile
                                </a>
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Application Details</h3>
                        <p className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /> Applied on: {format(new Date(applicant.appliedAt), 'PPP')}</p>
                        <p className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-muted-foreground" /> Source: {applicant.source || 'Unknown'}</p>
                         {applicant.resumeUrl && (
                            <Button variant="outline" asChild className="mt-2">
                                <Link href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" /> View Resume
                                </Link>
                            </Button>
                         )}
                    </div>
                    
                    {applicant.coverLetter && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Cover Letter</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{applicant.coverLetter}</p>
                            </div>
                        </>
                    )}
                    
                    {applicant.answers && vacancy.customForm && vacancy.customForm.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Application Form Answers</h3>
                                {vacancy.customForm.map(question => (
                                    <div key={question.id} className="text-sm">
                                        <p className="font-semibold text-muted-foreground">{question.text}</p>
                                        <p className="pl-4 border-l-2 ml-2 mt-1">{applicant.answers?.[question.id] || <i>Not answered</i>}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
