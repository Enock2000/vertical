
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { EmployeeForm, employeeFormSchema, type EmployeeFormValues } from './employee-form';
import { format } from 'date-fns';

interface AddEmployeeDialogProps {
  children: React.ReactNode;
  departments: Department[];
  branches: Branch[];
  banks: Bank[];
  onEmployeeAdded: () => void;
}

export function AddEmployeeDialog({
  children,
  departments,
  branches,
  banks,
  onEmployeeAdded,
}: AddEmployeeDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      departmentId: '',
      branchId: '',
      status: 'Active',
      location: '',
      annualLeaveBalance: 21,
      workerType: 'Salaried',
      salary: 0,
      hourlyRate: 0,
      hoursWorked: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      reimbursements: 0,
      bankName: '',
      accountNumber: '',
      branchCode: '',
      gender: undefined,
      dateOfBirth: '',
      identificationType: 'ID Number',
      identificationNumber: '',
      contractType: 'Permanent',
      contractStartDate: '',
      contractEndDate: '',
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    if (!companyId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find company. Unable to add employee.',
      });
      return;
    }
    setIsLoading(true);
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
      const user = userCredential.user;

      const { password, ...employeeData } = values;
      const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';
      const branchName = branches.find(b => b.id === values.branchId)?.name || '';
      
      const newEmployee: Omit<Employee, 'id'> = {
          ...employeeData,
          companyId: companyId,
          departmentName,
          branchName: branchName || '',
          avatar: `https://avatar.vercel.sh/${values.email}.png`,
          salary: values.salary || 0,
          hourlyRate: values.hourlyRate || 0,
          hoursWorked: values.hoursWorked || 0,
          joinDate: new Date().toISOString(),
          dateOfBirth: values.dateOfBirth,
          contractStartDate: values.contractStartDate || new Date().toISOString(),
      };

      // Save employee data to Realtime Database
      await set(ref(db, 'employees/' + user.uid), {
        ...newEmployee,
        id: user.uid
      });
      
      onEmployeeAdded();
      
      setOpen(false);
      form.reset();
      toast({
        title: 'Employee Added',
        description: `${values.name} has been successfully added with a login account.`,
      });

    } catch (error: any) {
        console.error("Error adding employee:", error);
        toast({
            variant: "destructive",
            title: "Failed to add employee",
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
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new employee and create their portal account.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
           <EmployeeForm
              form={form}
              departments={departments}
              branches={branches}
              banks={banks}
              onSubmit={onSubmit}
              isSubmitting={isLoading}
              submitButtonText="Save Employee"
              showAccountFields={true}
            />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
