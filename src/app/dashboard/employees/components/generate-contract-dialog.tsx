// src/app/dashboard/employees/components/generate-contract-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, update } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Download } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { generateContract } from '@/ai/flows/generate-contract-flow';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/app/auth-provider';

interface GenerateContractDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

export function GenerateContractDialog({
  children,
  employee,
}: GenerateContractDialogProps) {
  const { company } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contractText, setContractText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && company) {
      const generate = async () => {
        setIsLoading(true);
        try {
          const result = await generateContract({
            employeeName: employee.name,
            jobTitle: employee.role,
            companyName: company.name,
            salary: Number(employee.salary) || 0,
            contractType: employee.contractType || 'Permanent',
            contractStartDate: employee.contractStartDate ? new Date(employee.contractStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
            contractEndDate: employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
          });
          setContractText(result.contractText);
        } catch (error) {
          console.error('Error generating contract:', error);
          toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate the contract.',
          });
          setOpen(false);
        } finally {
          setIsLoading(false);
        }
      };
      generate();
    }
  }, [open, employee, company, toast]);
  
  const handleSaveAndUpload = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
        // This is a simplified example. In a real app, you'd generate a PDF.
        // For now, we'll upload the text content as a .txt file.
        const fileName = `Contract_${employee.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        const fileRef = storageRef(storage, `contracts/${company.id}/${employee.id}/${fileName}`);
        
        const snapshot = await uploadString(fileRef, contractText, 'raw');
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update employee record with the URL
        await update(dbRef(db, `employees/${employee.id}`), {
            contractFileUrl: downloadURL
        });

        toast({
            title: 'Contract Saved',
            description: `The contract for ${employee.name} has been saved.`,
        });
        setOpen(false);

    } catch (error) {
        console.error('Error saving contract:', error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the contract file.',
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI-Generated Employment Contract
          </DialogTitle>
          <DialogDescription>
            Review the generated contract for {employee.name}. You can edit it before saving.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <Textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={20}
            className="my-4"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndUpload} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
