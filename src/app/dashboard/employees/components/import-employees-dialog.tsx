// src/app/dashboard/employees/components/import-employees-dialog.tsx
'use client';

import { useState, useRef } from 'react';
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
import { Loader2, Download, Upload } from 'lucide-react';
import { importEmployees } from '@/ai/flows/import-employees-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImportEmployeesDialogProps {
    companyId: string;
    companyName: string;
    onImportComplete: () => void;
}

interface ImportResult {
    successful: number;
    failed: number;
    errors: string[];
}

export function ImportEmployeesDialog({ companyId, companyName, onImportComplete }: ImportEmployeesDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !companyId) {
        toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a CSV file to import.' });
        return;
    }
    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('companyId', companyId);
    formData.append('companyName', companyName);

    try {
        const importResult = await importEmployees(formData);
        if (importResult.success) {
            toast({ title: 'Import Complete', description: importResult.message });
            setResult(importResult.results);
            onImportComplete();
        } else {
            toast({ variant: 'destructive', title: 'Import Failed', description: importResult.message });
             setResult(importResult.results);
        }
    } catch (error: any) {
        console.error("Error importing employees:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsLoading(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        // Reset state when dialog closes
        setFile(null);
        setResult(null);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-rap">
            Import
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Employees via CSV</DialogTitle>
          <DialogDescription>
            Bulk upload your employee roster.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Alert>
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                    Download the sample CSV template to ensure your data is formatted correctly. The `email` column is mandatory and must be unique. The `workerType` must be one of: `Salaried`, `Hourly`, `Contractor`.
                </AlertDescription>
                <Button variant="link" asChild className="p-0 h-auto mt-2">
                    <Link href="/sample-employees.csv" download>
                        <Download className="mr-2 h-4 w-4"/>
                        Download Sample CSV
                    </Link>
                </Button>
            </Alert>
            
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                />
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? `Selected: ${file.name}` : 'Choose a CSV File'}
                </Button>
            </div>
            
            {result && (
                <Alert variant={result.failed > 0 ? 'destructive' : 'default'}>
                    <AlertTitle>Import Results</AlertTitle>
                    <AlertDescription>
                        <p>Successful: {result.successful}</p>
                        <p>Failed: {result.failed}</p>
                        {result.errors.length > 0 && (
                             <ScrollArea className="h-24 mt-2 border rounded p-2 text-xs">
                                {result.errors.map((err, i) => <p key={i}>{err}</p>)}
                            </ScrollArea>
                        )}
                    </AlertDescription>
                </Alert>
            )}

        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Start Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
