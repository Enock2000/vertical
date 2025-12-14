// src/app/dashboard/employees/components/generate-contract-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Loader2, FileText, Download, Printer, Eye, Edit } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { generateContract } from '@/ai/flows/generate-contract-flow';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/app/auth-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && company) {
      const generate = async () => {
        setIsLoading(true);
        try {
          const result = await generateContract({
            employeeName: employee.name,
            jobTitle: employee.jobTitle || employee.role,
            companyName: company.name,
            salary: Number(employee.salary) || 0,
            contractType: employee.contractType || 'Permanent',
            contractStartDate: employee.contractStartDate
              ? new Date(employee.contractStartDate).toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' })
              : new Date().toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' }),
            contractEndDate: employee.contractEndDate
              ? new Date(employee.contractEndDate).toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined,
            companyAddress: company.address,
            employeeAddress: employee.address,
            employeeNRC: employee.nrcNumber,
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
      const fileName = `Contract_${employee.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      const fileRef = storageRef(storage, `contracts/${company.id}/${employee.id}/${fileName}`);

      const snapshot = await uploadString(fileRef, contractText, 'raw');
      const downloadURL = await getDownloadURL(snapshot.ref);

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Employment Contract - ${employee.name}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.5;
              margin: 40px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>${contractText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([contractText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Employment_Contract_${employee.name.replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1000px] h-[90vh] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Employment Contract
          </DialogTitle>
          <DialogDescription>
            Review the employment contract for {employee.name}. You can preview, edit, print, or download.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 p-6 space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating comprehensive contract...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'edit')} className="flex-1 flex flex-col min-h-0">
              <TabsList className="shrink-0 mb-4">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </TabsTrigger>
                <TabsTrigger value="edit" className="gap-2">
                  <Edit className="h-4 w-4" /> Edit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 min-h-0 m-0">
                <ScrollArea className="h-full border rounded-lg bg-white dark:bg-gray-950">
                  <div
                    ref={previewRef}
                    className="p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ minHeight: '100%' }}
                  >
                    {contractText}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="edit" className="flex-1 min-h-0 m-0">
                <Textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="h-full min-h-[500px] font-mono text-xs resize-none"
                  style={{ height: '100%' }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="p-6 pt-4 shrink-0 border-t flex-wrap gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <Button onClick={handleSaveAndUpload} disabled={isLoading || isSaving} className="sm:ml-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save to Employee Record
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
