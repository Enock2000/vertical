
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import type { Employee, Department, Bank, Branch } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { EmployeeForm, employeeFormSchema, type EmployeeFormValues } from './employee-form';
import { format } from 'date-fns';

interface EditEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
  departments: Department[];
  branches: Branch[];
  banks: Bank[];
  onEmployeeUpdated: () => void;
}

// Define a separate schema for editing, which does not include the password field.
const editEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().optional(),
  identificationType: z.enum(['ID Number', 'Passport', 'License']).optional(),
  identificationNumber: z.string().optional(),
  role: z.string().min(2, 'Role must be at least 2 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  branchId: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'On Leave', 'Sick', 'Applicant']),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  annualLeaveBalance: z.coerce.number().min(0, 'Leave balance cannot be negative.'),
  workerType: z.enum(['Salaried', 'Hourly', 'Contractor']),
  salary: z.coerce.number().min(0, 'Salary must be a positive number.').optional(),
  hourlyRate: z.coerce.number().min(0, 'Hourly rate must be a positive number.').optional(),
  hoursWorked: z.coerce.number().min(0, 'Hours worked must be a positive number.').optional(),
  allowances: z.coerce.number().min(0, 'Allowances cannot be negative.'),
  deductions: z.coerce.number().min(0, 'Deductions cannot be negative.'),
  overtime: z.coerce.number().min(0, 'Overtime cannot be negative.'),
  bonus: z.coerce.number().min(0, 'Bonus cannot be negative.'),
  reimbursements: z.coerce.number().min(0, 'Reimbursements cannot be negative.'),
  // Bank Details
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchCode: z.string().optional(),
  // Contract Details
  contractType: z.enum(['Permanent', 'Fixed-Term', 'Internship']).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
}).refine(data => {
    if (data.workerType === 'Hourly' && (data.hourlyRate === undefined || data.hoursWorked === undefined)) {
        return false;
    }
    return true;
}, {
    message: "Hourly rate and hours worked are required for Hourly employees.",
    path: ["hourlyRate"],
});


export function EditEmployeeDialog({
  children,
  employee,
  departments,
  branches,
  banks,
  onEmployeeUpdated,
}: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<Omit<EmployeeFormValues, 'password'>>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      ...employee,
      gender: employee.gender || undefined,
      branchId: employee.branchId || '',
      dateOfBirth: employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'yyyy-MM-dd') : '',
      identificationType: employee.identificationType || undefined,
      identificationNumber: employee.identificationNumber || '',
      bankName: employee.bankName || '',
      accountNumber: employee.accountNumber || '',
      branchCode: employee.branchCode || '',
      annualLeaveBalance: employee.annualLeaveBalance || 0,
      contractType: employee.contractType || 'Permanent',
      contractStartDate: employee.contractStartDate ? format(new Date(employee.contractStartDate), 'yyyy-MM-dd') : '',
      contractEndDate: employee.contractEndDate ? format(new Date(employee.contractEndDate), 'yyyy-MM-dd') : '',
    },
  });

  async function onSubmit(values: Omit<EmployeeFormValues, 'password'>) {
    setIsLoading(true);
    
    try {
      const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';
      const branchName = branches.find(b => b.id === values.branchId)?.name || '';
      
      const updatedEmployeeData: Partial<Employee> = {
          ...values,
          departmentName,
          branchName,
          salary: values.salary || 0,
          hourlyRate: values.hourlyRate || 0,
          hoursWorked: values.hoursWorked || 0,
      };

      await update(ref(db, 'employees/' + employee.id), updatedEmployeeData);
      
      onEmployeeUpdated();
      
      setOpen(false);
      toast({
        title: 'Employee Updated',
        description: `${values.name}'s profile has been successfully updated.`,
      });

    } catch (error: any) {
        console.error("Error updating employee:", error);
        toast({
            variant: "destructive",
            title: "Failed to update employee",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
          <DialogDescription>
            Update the details for {employee.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <EmployeeForm
              form={form as any} // Cast form to allow it to be passed
              departments={departments}
              branches={branches}
              banks={banks}
              onSubmit={onSubmit as any} // Cast onSubmit to allow it to be passed
              isSubmitting={isLoading}
              submitButtonText="Save Changes"
            />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
