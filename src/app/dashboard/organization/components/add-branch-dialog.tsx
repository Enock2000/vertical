// src/app/dashboard/organization/components/add-branch-dialog.tsx
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

const formSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters.'),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  ipAddress: z.string().optional(),
});

type AddBranchFormValues = z.infer<typeof formSchema>;

interface AddBranchDialogProps {
  children: React.ReactNode;
  onBranchAdded: () => void;
}

export function AddBranchDialog({
  children,
  onBranchAdded,
}: AddBranchDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddBranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      ipAddress: '',
    },
  });

  async function onSubmit(values: AddBranchFormValues) {
    if (!companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Company not found.' });
        return;
    }
    setIsLoading(true);
    try {
      const branchesRef = ref(db, `companies/${companyId}/branches`);
      const newBranchRef = push(branchesRef);
      
      await set(newBranchRef, {
        id: newBranchRef.key,
        ...values,
      });

      onBranchAdded();
      setOpen(false);
      form.reset();
      toast({
        title: 'Branch Added',
        description: `The branch "${values.name}" has been successfully created.`,
      });
    } catch (error: any) {
      console.error('Error adding branch:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add branch',
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
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>
            Enter the details for the new company branch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lusaka Main" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lusaka, Zambia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed IP Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 192.168.1.1" {...field} />
                  </FormControl>
                   <p className="text-xs text-muted-foreground">Restricts clock-in/out to this IP for employees in this branch.</p>
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
                  'Save Branch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
