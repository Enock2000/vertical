'use client';

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
import { Printer, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PayslipDialogProps {
  employee: Employee;
  payrollDetails: PayrollDetails | null;
  children: React.ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function PayslipDialog({ employee, payrollDetails, children }: PayslipDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
          <DialogDescription>
            Payslip for {employee.name} - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
        {payrollDetails ? (
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                      <h3 className="font-semibold">Company Name</h3>
                      <p>VerticalSync Inc.</p>
                  </div>
                  <div className="text-right">
                      <h3 className="font-semibold">Employee Details</h3>
                      <p>{employee.name}</p>
                      <p>{employee.role}</p>
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
          </div>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={handlePrint} disabled={!payrollDetails}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
