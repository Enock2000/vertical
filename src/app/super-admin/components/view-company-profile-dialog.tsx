// src/app/super-admin/components/view-company-profile-dialog.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Company } from '@/lib/data';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

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
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveLogo = async () => {
    setIsSaving(true);
    try {
        await update(ref(db, `companies/${company.id}`), { logoUrl });
        toast({ title: 'Logo URL Saved', description: `The logo for ${company.name} has been updated.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save logo URL.' });
    } finally {
        setIsSaving(false);
    }
  };

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

            <div className="space-y-2">
                <Label htmlFor="logo-url">Company Logo URL</Label>
                <Input 
                    id="logo-url" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                />
            </div>
            {logoUrl && (
                <div>
                    <Label>Logo Preview</Label>
                    <div className="mt-2 flex items-center justify-center rounded-md border p-4 h-32">
                        <Image src={logoUrl} alt="Company Logo Preview" width={100} height={100} className="object-contain" />
                    </div>
                </div>
            )}
        </div>
         <DialogFooter>
          <Button onClick={handleSaveLogo} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
