// src/app/dashboard/finance/components/add-customer-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
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
import { useAuth } from '@/app/auth-provider';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Customer name is required.'),
  email: z.string().email('Invalid email address.'),
  address: z.string().min(5, 'Address is required.'),
});

type AddCustomerFormValues = z.infer<typeof formSchema>;

interface AddCustomerDialogProps {
  children: React.ReactNode;
  onCustomerAdded: () => void;
}

export function AddCustomerDialog({ children, onCustomerAdded }: AddCustomerDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddCustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
    },
  });

  async function onSubmit(values: AddCustomerFormValues) {
    if (!companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Company not found.' });
        return;
    }
    setIsLoading(true);
    try {
      const customersRef = ref(db, `companies/${companyId}/customers`);
      const newCustomerRef = push(customersRef);
      
      await set(newCustomerRef, {
        id: newCustomerRef.key,
        ...values,
      });

      onCustomerAdded();
      setOpen(false);
      form.reset();
      toast({
        title: 'Customer Added',
        description: `"${values.name}" has been added to your customer list.`,
      });
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add customer',
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
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter the details for the new customer.
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
                    <Input placeholder="e.g., John Doe" {...field} />
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
                      <Input type="email" placeholder="customer@example.com" {...field} />
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
                      <Textarea placeholder="123 Main St, Anytown" {...field} />
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
                  'Save Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
