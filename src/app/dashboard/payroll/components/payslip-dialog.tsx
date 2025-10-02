
'use client';

import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Employee, PayrollDetails } from '@/lib/data';
import { Printer, Loader2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface PayslipDialogProps {
  employee: Employee;
  payrollDetails: PayrollDetails | null;
  companyName: string;
  children: React.ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function PayslipDialog({ employee, payrollDetails, companyName, children }: PayslipDialogProps) {
  const payslipRef = useRef<HTMLDivElement>(null);
  const payslipDate = format(new Date(), 'MMMM yyyy');

  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    if (payslipRef.current) {
        html2canvas(payslipRef.current, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip_${employee.name.replace(' ', '_')}_${payslipDate}.pdf`);
        });
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
          <DialogDescription>
            Payslip for {employee.name} - {payslipDate}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
        {payrollDetails ? (
          <div ref={payslipRef} className="space-y-4 p-4 bg-background">
              <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">{companyName}</h2>
                  <p className="text-sm font-medium">Payslip for {payslipDate}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                      <h3 className="font-semibold">Employee Details</h3>
                      <p>{employee.name}</p>
                      <p>{employee.role}</p>
                  </div>
                  <div className="text-right">
                      <h3 className="font-semibold">Payment Method</h3>
                      <p className="text-xs text-muted-foreground">Bank: {employee.bankName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Account: {employee.accountNumber || 'N/A'}</p>
                  </div>
              </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Earnings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Pay</span>
                  <span>{currencyFormatter.format(payrollDetails.basePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances</span>
                  <span>{currencyFormatter.format(employee.allowances)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime</span>
                  <span>{currencyFormatter.format(payrollDetails.overtimePay)}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Bonus</span>
                  <span>{currencyFormatter.format(employee.bonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reimbursements</span>
                  <span>{currencyFormatter.format(employee.reimbursements)}</span>
                </div>
              </div>
            </div>
            <Separator />
             <div className="flex justify-between font-semibold">
                  <span>Gross Pay</span>
                  <span>{currencyFormatter.format(payrollDetails.grossPay)}</span>
              </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Deductions & Contributions</h4>
              <div className="space-y-1 text-sm">
                 <div className="flex justify-between">
                  <span>NAPSA (Employee)</span>
                  <span>({currencyFormatter.format(payrollDetails.employeeNapsaDeduction)})</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>NAPSA (Employer)</span>
                  <span>{currencyFormatter.format(payrollDetails.employerNapsaContribution)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NHIMA (Employee)</span>
                  <span>({currencyFormatter.format(payrollDetails.employeeNhimaDeduction)})</span>
                </div>
                 <div className="flex justify-between text-muted-foreground">
                  <span>NHIMA (Employer)</span>
                  <span>{currencyFormatter.format(payrollDetails.employerNhimaContribution)}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Income Tax (PAYE)</span>
                  <span>({currencyFormatter.format(payrollDetails.taxDeduction)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Deductions</span>
                  <span>({currencyFormatter.format(employee.deductions)})</span>
                </div>
              </div>
            </div>
             <Separator />
             <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span>({currencyFormatter.format(payrollDetails.totalDeductions)})</span>
              </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Net Pay</span>
              <span>{currencyFormatter.format(payrollDetails.netPay)}</span>
            </div>
             <Separator />
             <div className="text-center text-xs text-muted-foreground pt-2">
                <p>VerticalSync powered by Oran Investment</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        </ScrollArea>
        <DialogFooter className="sm:justify-start gap-2">
            <Button type="button" onClick={handlePrint} disabled={!payrollDetails}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
             <Button type="button" variant="secondary" onClick={handleDownload} disabled={!payrollDetails}>
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
