
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

interface EditEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
  departments: Department[];
  branches: Branch[];
  banks: Bank[];
  onEmployeeUpdated: () => void;
}

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

  // We remove password from the schema for editing
  const editSchema = employeeFormSchema.omit({ password: true });

  const form = useForm<Omit<EmployeeFormValues, 'password'>>({
    resolver: zodResolver(editSchema),
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
