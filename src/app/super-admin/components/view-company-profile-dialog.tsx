// src/app/super-admin/components/view-company-profile-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Company } from '@/lib/data';
import { format } from 'date-fns';

interface ViewCompanyProfileDialogProps {
  children: React.ReactNode;
  company: Company;
}

const DetailItem = ({ label, value }: { label: string, value: string | undefined | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value || '-'}</p>
    </div>
);

export function ViewCompanyProfileDialog({ children, company }: ViewCompanyProfileDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{company.name}</DialogTitle>
          <DialogDescription>
            Full company profile and registration details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <DetailItem label="Company TPIN" value={company.tpin} />
            <DetailItem label="Company Address" value={company.address} />
            <DetailItem label="Admin Contact Name" value={company.contactName} />
            <DetailItem label="Admin Contact Number" value={company.contactNumber} />
            <DetailItem label="Admin Email" value={company.adminEmail} />
            <DetailItem label="Registration Date" value={format(new Date(company.createdAt), 'MMMM d, yyyy')} />
            <DetailItem label="Status" value={company.status} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
