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
import { Loader2, FileText, Download, Printer, Eye, Edit, FileType } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { generateContract } from '@/ai/flows/generate-contract-flow';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/app/auth-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

interface GenerateContractDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

type FontStyle = 'Modern' | 'Classic' | 'Typewriter' | 'Handwriting';

export function GenerateContractDialog({
  children,
  employee,
}: GenerateContractDialogProps) {
  const { company } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contractText, setContractText] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [selectedTemplate, setSelectedTemplate] = useState<'Standard' | 'Simple'>('Standard');
  const [selectedFont, setSelectedFont] = useState<FontStyle>('Modern');
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
            template: selectedTemplate,
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
  }, [open, employee, company, toast, selectedTemplate]);

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
    const fontStack = {
      'Modern': 'Helvetica, Arial, sans-serif',
      'Classic': "'Times New Roman', serif",
      'Typewriter': "'Courier New', Courier, monospace",
      'Handwriting': "'Brush Script MT', 'Comic Sans MS', cursive"
    }[selectedFont];

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Employment Contract - ${employee.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
            body {
              font-family: ${selectedFont === 'Handwriting' ? "'Caveat', cursive" : fontStack};
              font-size: ${selectedFont === 'Handwriting' ? '16px' : '12px'};
              line-height: 1.6;
              margin: 50px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body { margin: 30px; }
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

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const lines = contractText.split('\n');
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 5;
      let y = margin;

      // Select PDF font based on selection
      let fontName = 'helvetica';
      let fontStyle = 'normal';

      switch (selectedFont) {
        case 'Classic':
          fontName = 'times';
          break;
        case 'Typewriter':
          fontName = 'courier';
          break;
        case 'Handwriting':
          fontName = 'times';
          fontStyle = 'italic'; // Fallback for handwriting
          break;
        default: // Modern
          fontName = 'helvetica';
      }

      pdf.setFont(fontName, fontStyle);
      pdf.setFontSize(selectedFont === 'Handwriting' ? 11 : 9);

      lines.forEach((line) => {
        // Sanitize line for PDF (replace unsupported characters)
        let contentLine = line
          .replace(/═/g, '=')
          .replace(/☐/g, '[ ]')
          .replace(/•/g, '-');

        // Check for section headers (lines with = after replacement)
        if (contentLine.includes('====')) {
          pdf.setFont(fontName, 'bold');
          pdf.setFontSize(10);
        } else if (contentLine.match(/^SECTION \d+|^[A-Z\s]{10,}$/)) {
          pdf.setFont(fontName, 'bold');
          pdf.setFontSize(10);
        } else {
          // Revert to selected style
          if (selectedFont === 'Handwriting') {
            pdf.setFont('times', 'italic');
          } else {
            pdf.setFont(fontName, 'normal');
          }
          pdf.setFontSize(selectedFont === 'Handwriting' ? 11 : 9);
        }

        // ... (rest of loop)


        // Word wrap
        const textLines = pdf.splitTextToSize(contentLine, pageWidth - (margin * 2));

        textLines.forEach((textLine: string) => {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(textLine, margin, y);
          y += lineHeight;
        });
      });

      pdf.save(`Employment_Contract_${employee.name.replace(/ /g, '_')}.pdf`);

      toast({
        title: 'PDF Downloaded',
        description: 'Contract has been saved as PDF.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not generate PDF.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsExporting(true);
    try {
      const lines = contractText.split('\n');
      const paragraphs: Paragraph[] = [];

      lines.forEach((line) => {
        // Check for section headers
        if (line.includes('═══')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, font: 'Courier New', size: 20 })],
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (line.match(/^SECTION \d+/) || line.match(/^[A-Z\s]{15,}$/)) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, font: 'Courier New', size: 22 })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            })
          );
        } else if (line.trim().startsWith('Chapter') || line.match(/^\d+\.\d+/)) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, font: 'Courier New', size: 20 })],
              spacing: { before: 200, after: 50 },
            })
          );
        } else if (line.trim() === '') {
          paragraphs.push(new Paragraph({ children: [] }));
        } else {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Courier New', size: 18 })],
              spacing: { after: 50 },
            })
          );
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Employment_Contract_${employee.name.replace(/ /g, '_')}.docx`);

      toast({
        title: 'Word Document Downloaded',
        description: 'Contract has been saved as .docx file.',
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not generate Word document.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1000px] h-[90vh] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 shrink-0 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Employment Contract
            </DialogTitle>
            <DialogDescription>
              Review the employment contract for {employee.name}. Export as PDF or Word document.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Template:</span>
            <Select value={selectedTemplate} onValueChange={(v: 'Standard' | 'Simple') => setSelectedTemplate(v)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Simple">Simple</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-sm font-medium ml-2">Font:</span>
            <Select value={selectedFont} onValueChange={(v: FontStyle) => setSelectedFont(v)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Modern">Modern (Sans)</SelectItem>
                <SelectItem value="Classic">Classic (Serif)</SelectItem>
                <SelectItem value="Typewriter">Typewriter</SelectItem>
                <SelectItem value="Handwriting">Handwriting</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
                  <div
                    ref={previewRef}
                    className="p-6 text-xs leading-relaxed whitespace-pre-wrap"
                    style={{
                      minHeight: '100%',
                      fontFamily: {
                        'Modern': 'Helvetica, Arial, sans-serif',
                        'Classic': "'Times New Roman', serif",
                        'Typewriter': "'Courier New', Courier, monospace",
                        'Handwriting': "'Caveat', cursive"
                      }[selectedFont],
                      fontSize: selectedFont === 'Handwriting' ? '16px' : '12px'
                    }}
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

        <DialogFooter className="p-6 pt-4 shrink-0 border-t">
          <div className="flex flex-wrap gap-2 w-full justify-between">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving || isExporting}>
              Cancel
            </Button>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handlePrint} disabled={isLoading || isExporting}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isLoading || isExporting}>
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <FileType className="mr-2 h-4 w-4 text-red-600" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadWord}>
                    <FileType className="mr-2 h-4 w-4 text-blue-600" />
                    Download as Word (.docx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleSaveAndUpload} disabled={isLoading || isSaving || isExporting}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Save to Record
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
