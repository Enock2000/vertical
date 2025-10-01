
// src/app/dashboard/employees/components/terminate-contract-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update, push, set } from 'firebase/database';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, FileX2 } from 'lucide-react';
import type { Employee, AuditLog } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


const formSchema = z.object({
  terminationDate: z.date({ required_error: "Termination date is required." }),
  terminationReason: z.string().min(10, 'A reason for termination is required.'),
});

type TerminateContractFormValues = z.infer<typeof formSchema>;

interface TerminateContractDialogProps {
  children: React.ReactNode;
  employee: Employee;
  onContractTerminated: () => void;
}

export function TerminateContractDialog({
  children,
  employee,
  onContractTerminated,
}: TerminateContractDialogProps) {
  const { companyId, employee: adminEmployee } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TerminateContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        terminationDate: new Date(),
        terminationReason: '',
    },
  });

  async function createAuditLog(log: Omit<AuditLog, 'id' | 'companyId'>) {
    if (!companyId) return;
    const logRef = ref(db, `companies/${companyId}/auditLogs`);
    const newLogRef = push(logRef);
    await set(newLogRef, { ...log, id: newLogRef.key, companyId });
  }

  async function onSubmit(values: TerminateContractFormValues) {
    if (!companyId || !adminEmployee) return;
    setIsLoading(true);
    try {
      const employeeRef = ref(db, `employees/${employee.id}`);
      const updates = {
        status: 'Inactive',
        terminationDate: values.terminationDate.toISOString(),
        terminationReason: values.terminationReason,
      };

      await update(employeeRef, updates);

      await createAuditLog({
          actor: adminEmployee.name,
          action: 'Contract Terminated',
          details: `Contract for ${employee.name} (ID: ${employee.id}) was terminated. Reason: ${values.terminationReason}`,
          timestamp: new Date().toISOString(),
      });
      
      onContractTerminated();
      setOpen(false);
      toast({
        title: 'Contract Terminated',
        description: `${employee.name}'s status has been set to Inactive.`,
      });
    } catch (error: any) {
      console.error('Error terminating contract:', error);
      toast({
        variant: 'destructive',
        title: 'Termination Failed',
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
          <DialogTitle>Terminate Contract for {employee.name}</DialogTitle>
          <DialogDescription>
            This action will set the employee's status to "Inactive" and record the termination details. It cannot be easily undone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="terminationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Termination Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terminationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Termination</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a clear reason for contract termination..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} variant="destructive">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Terminating...
                  </>
                ) : (
                    <>
                        <FileX2 className="mr-2 h-4 w-4" />
                        Confirm Termination
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
