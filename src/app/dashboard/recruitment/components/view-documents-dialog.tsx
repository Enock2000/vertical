
// src/app/dashboard/recruitment/components/view-documents-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, MessageSquare } from 'lucide-react';
import type { Applicant, JobVacancy } from '@/lib/data';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface ViewDocumentsDialogProps {
  children: React.ReactNode;
  applicant: Applicant;
  vacancy: JobVacancy;
}

export function ViewDocumentsDialog({ children, applicant, vacancy }: ViewDocumentsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Submitted documents and form answers for {applicant.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            {applicant.resumeUrl && (
                <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Resume</span>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4"/>
                            View
                        </Link>
                    </Button>
                </div>
            )}
            {applicant.answers && vacancy.customForm && vacancy.customForm.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Application Form Answers</span>
                        </div>
                        {vacancy.customForm.map(question => (
                            <div key={question.id} className="text-sm">
                                <p className="font-semibold">{question.text}</p>
                                <p className="text-muted-foreground">{applicant.answers?.[question.id] || <i>Not answered</i>}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
