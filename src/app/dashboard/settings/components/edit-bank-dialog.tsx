// src/app/dashboard/settings/components/edit-bank-dialog.tsx
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
import type { Bank } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(3, 'Bank name is required.'),
  swiftCode: z.string().min(8, 'SWIFT code must be at least 8 characters.').max(11, 'SWIFT code cannot be more than 11 characters.'),
});

type EditBankFormValues = z.infer<typeof formSchema>;

interface EditBankDialogProps {
  children: React.ReactNode;
  bank: Bank;
}

export function EditBankDialog({ children, bank }: EditBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditBankFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bank.name,
      swiftCode: bank.swiftCode,
    },
  });

  async function onSubmit(values: EditBankFormValues) {
    setIsLoading(true);
    try {
      const bankRef = ref(db, `banks/${bank.id}`);
      await update(bankRef, values);
      
      setOpen(false);
      toast({
        title: 'Bank Updated',
        description: `The details for "${values.name}" have been updated.`,
      });
    } catch (error: any) {
        console.error("Error updating bank:", error);
        toast({
            variant: "destructive",
            title: "Failed to update bank",
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
          <DialogTitle>Edit Bank Details</DialogTitle>
          <DialogDescription>
            Update the name and SWIFT code for {bank.name}.
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
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
