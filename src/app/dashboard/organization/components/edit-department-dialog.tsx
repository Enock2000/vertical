// src/app/dashboard/organization/components/edit-department-dialog.tsx
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Department } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters.'),
  minSalary: z.coerce.number().min(0, 'Minimum salary must be a positive number.'),
  maxSalary: z.coerce.number().min(0, 'Maximum salary must be a positive number.'),
}).refine(data => data.maxSalary >= data.minSalary, {
    message: "Maximum salary must be greater than or equal to minimum salary.",
    path: ["maxSalary"],
});

type EditDepartmentFormValues = z.infer<typeof formSchema>;

interface EditDepartmentDialogProps {
  children: React.ReactNode;
  department: Department;
  onDepartmentUpdated: () => void;
}

export function EditDepartmentDialog({
  children,
  department,
  onDepartmentUpdated,
}: EditDepartmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditDepartmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department.name,
      minSalary: department.minSalary,
      maxSalary: department.maxSalary,
    },
  });

  async function onSubmit(values: EditDepartmentFormValues) {
    setIsLoading(true);
    try {
      const departmentRef = ref(db, `departments/${department.id}`);
      
      const updatedDepartmentData = {
        name: values.name,
        minSalary: values.minSalary,
        maxSalary: values.maxSalary,
      };

      await update(departmentRef, updatedDepartmentData);

      onDepartmentUpdated();
      setOpen(false);
      toast({
        title: 'Department Updated',
        description: `The department "${values.name}" has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update department',
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
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Modify the details for the "{department.name}" department.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Human Resources" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="minSalary"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Minimum Salary</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 30000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="maxSalary"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Maximum Salary</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 80000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
