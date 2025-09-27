// src/app/dashboard/payment-methods/components/edit-payment-method-dialog.tsx
'use client';

import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/data';
import { zambianBanks } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

const formSchema = z.object({
  bankName: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().min(5, 'Account number must be at least 5 characters.'),
  branchCode: z.string().optional(),
});

type EditPaymentMethodFormValues = z.infer<typeof formSchema>;

interface EditPaymentMethodDialogProps {
  children: React.ReactNode;
  employee: Employee;
  onPaymentMethodUpdated: () => void;
}

export function EditPaymentMethodDialog({
  children,
  employee,
  onPaymentMethodUpdated,
}: EditPaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditPaymentMethodFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: employee.bankName || '',
      accountNumber: employee.accountNumber || '',
      branchCode: employee.branchCode || '',
    },
  });

  async function onSubmit(values: EditPaymentMethodFormValues) {
    setIsLoading(true);
    try {
      const employeeRef = ref(db, 'employees/' + employee.id);
      await update(employeeRef, {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        branchCode: values.branchCode,
      });
      
      onPaymentMethodUpdated();
      setOpen(false);
      toast({
        title: 'Payment Method Updated',
        description: `Bank details for ${employee.name} have been successfully updated.`,
      });

    } catch (error: any) {
        console.error("Error updating payment method:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment Method</DialogTitle>
          <DialogDescription>
            Update the bank details for {employee.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {zambianBanks.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter branch code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
