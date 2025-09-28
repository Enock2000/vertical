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
import { FileText, Download } from 'lucide-react';
import type { Applicant } from '@/lib/data';
import Link from 'next/link';

interface ViewDocumentsDialogProps {
  children: React.ReactNode;
  applicant: Applicant;
}

export function ViewDocumentsDialog({ children, applicant }: ViewDocumentsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submitted Documents</DialogTitle>
          <DialogDescription>
            Documents submitted by {applicant.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            {/* Add more document types here in the future */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
