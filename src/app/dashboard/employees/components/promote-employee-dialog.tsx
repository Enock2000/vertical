// src/app/dashboard/employees/components/promote-employee-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import type { Employee, Role } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

const formSchema = z.object({
  adminRoleId: z.string().min(1, 'Please select an admin role.'),
});

type PromoteEmployeeFormValues = z.infer<typeof formSchema>;

interface PromoteEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
  roles: Role[];
  onEmployeePromoted: () => void;
}

export function PromoteEmployeeDialog({
  children,
  employee,
  roles,
  onEmployeePromoted,
}: PromoteEmployeeDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PromoteEmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminRoleId: employee.adminRoleId || '',
    },
  });

  async function onSubmit(values: PromoteEmployeeFormValues) {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const employeeRef = ref(db, `employees/${employee.id}`);
      const updates: Partial<Employee> = {
        role: 'Admin', // Promote the main role
        adminRoleId: values.adminRoleId,
      };

      // If the employee doesn't already have a 'jobTitle', use their current 'role' as the jobTitle.
      if (!employee.jobTitle) {
        updates.jobTitle = employee.role;
      }

      await update(employeeRef, updates);

      onEmployeePromoted();
      setOpen(false);
      toast({
        title: 'Employee Promoted',
        description: `${employee.name} has been promoted to an Admin role.`,
      });
    } catch (error: any) {
      console.error('Error promoting employee:', error);
      toast({
        variant: 'destructive',
        title: 'Promotion Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {employee.name} as Admin</DialogTitle>
          <DialogDescription>
            Select an administrative role to grant specific permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminRoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Assign as Admin
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
