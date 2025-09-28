// src/app/dashboard/settings/components/add-bank-dialog.tsx
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

const formSchema = z.object({
  name: z.string().min(3, 'Bank name is required.'),
  swiftCode: z.string().min(8, 'SWIFT code must be at least 8 characters.').max(11, 'SWIFT code cannot be more than 11 characters.'),
});

type AddBankFormValues = z.infer<typeof formSchema>;

interface AddBankDialogProps {
  children: React.ReactNode;
}

export function AddBankDialog({ children }: AddBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddBankFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      swiftCode: '',
    },
  });

  async function onSubmit(values: AddBankFormValues) {
    setIsLoading(true);
    try {
      const banksRef = ref(db, 'banks');
      const newBankRef = push(banksRef);
      
      await set(newBankRef, {
        id: newBankRef.key,
        ...values
      });
      
      setOpen(false);
      form.reset();
      toast({
        title: 'Bank Added',
        description: `The bank "${values.name}" has been added.`,
      });
    } catch (error: any) {
        console.error("Error adding bank:", error);
        toast({
            variant: "destructive",
            title: "Failed to add bank",
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
          <DialogTitle>Add New Bank</DialogTitle>
          <DialogDescription>
            Enter the details for the new bank.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank of Zambia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ZNCOZMLU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Bank'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
