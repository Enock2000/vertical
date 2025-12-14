
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
    return allEmployees?.find(emp => emp.id === employeeId);
  }

  // Safely get employees from payroll run
  const payrollEmployees = payrollRun?.employees ? Object.values(payrollRun.employees) : [];

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
            Details for the payroll run on {payrollRun?.runDate ? format(new Date(payrollRun.runDate), 'MMMM d, yyyy') : 'Unknown date'}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {payrollEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employee data found for this payroll run.
            </div>
          ) : (
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
                {payrollEmployees.map((runEmployee: PayrollRunEmployee) => {
                  const fullEmployee = getEmployeeDetails(runEmployee?.employeeId);

                  return (
                    <TableRow key={runEmployee?.employeeId || Math.random()}>
                      <TableCell>{runEmployee?.employeeName || 'Unknown'}</TableCell>
                      <TableCell>{currencyFormatter.format(runEmployee?.grossPay || 0)}</TableCell>
                      <TableCell>{currencyFormatter.format(runEmployee?.netPay || 0)}</TableCell>
                      <TableCell className="text-right">
                        {fullEmployee && (
                          <PayslipDialog
                            employee={fullEmployee}
                            payrollDetails={runEmployee}
                            companyName={companyName}
                            payslipDate={new Date(payrollRun?.runDate || new Date())}
                          >
                            <Button variant="ghost" size="sm">
                              <Receipt className="mr-2 h-4 w-4" />
                              Payslip
                            </Button>
                          </PayslipDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

