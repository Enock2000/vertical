
// src/app/dashboard/payroll/components/view-payroll-run-dialog.tsx
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Receipt } from 'lucide-react';
import type { PayrollRun, Employee, PayrollRunEmployee } from '@/lib/data';
import { format } from 'date-fns';
import { PayslipDialog } from './payslip-dialog';

interface ViewPayrollRunDialogProps {
  payrollRun: PayrollRun;
  allEmployees: Employee[];
  companyName: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function ViewPayrollRunDialog({ payrollRun, allEmployees, companyName }: ViewPayrollRunDialogProps) {
  
  const getEmployeeDetails = (employeeId: string): Employee | undefined => {
    return allEmployees.find(emp => emp.id === employeeId);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll Run Details</DialogTitle>
          <DialogDescription>
            Details for the payroll run on {format(new Date(payrollRun.runDate), 'MMMM d, yyyy')}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(payrollRun.employees).map((runEmployee: PayrollRunEmployee) => {
                        const fullEmployee = getEmployeeDetails(runEmployee.employeeId);
                        if (!fullEmployee) return null;

                        return (
                            <TableRow key={runEmployee.employeeId}>
                                <TableCell>{runEmployee.employeeName}</TableCell>
                                <TableCell>{currencyFormatter.format(runEmployee.grossPay)}</TableCell>
                                <TableCell>{currencyFormatter.format(runEmployee.netPay)}</TableCell>
                                <TableCell className="text-right">
                                    <PayslipDialog
                                        employee={fullEmployee}
                                        payrollDetails={runEmployee}
                                        companyName={companyName}
                                        payslipDate={new Date(payrollRun.runDate)}
                                    >
                                        <Button variant="ghost" size="sm">
                                            <Receipt className="mr-2 h-4 w-4" />
                                            Payslip
                                        </Button>
                                    </PayslipDialog>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
