// src/app/dashboard/finance/components/edit-customer-dialog.tsx
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
import type { Customer } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Customer name is required.'),
  email: z.string().email('Invalid email address.'),
  address: z.string().min(5, 'Address is required.'),
});

type EditCustomerFormValues = z.infer<typeof formSchema>;

interface EditCustomerDialogProps {
  children: React.ReactNode;
  customer: Customer;
  onCustomerUpdated: () => void;
}

export function EditCustomerDialog({ children, customer, onCustomerUpdated }: EditCustomerDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: customer.name,
        email: customer.email,
        address: customer.address,
    },
  });

  async function onSubmit(values: EditCustomerFormValues) {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const customerRef = ref(db, `companies/${companyId}/customers/${customer.id}`);
      await update(customerRef, values);
      onCustomerUpdated();
      setOpen(false);
      toast({
        title: 'Customer Updated',
        description: `"${values.name}" has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update customer',
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
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update the details for "{customer.name}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                      <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                      <Textarea {...field} />
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
