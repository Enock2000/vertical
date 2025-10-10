// src/app/dashboard/organization/components/edit-branch-dialog.tsx
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
import { useAuth } from '@/app/auth-provider';
import type { Branch } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters.'),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  ipAddress: z.string().optional(),
});

type EditBranchFormValues = z.infer<typeof formSchema>;

interface EditBranchDialogProps {
  children: React.ReactNode;
  branch: Branch;
  onBranchUpdated: () => void;
}

export function EditBranchDialog({
  children,
  branch,
  onBranchUpdated,
}: EditBranchDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditBranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: branch.name,
      location: branch.location,
      ipAddress: branch.ipAddress || '',
    },
  });

  async function onSubmit(values: EditBranchFormValues) {
    if (!companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Company not found.' });
        return;
    }
    setIsLoading(true);
    try {
      const branchRef = ref(db, `companies/${companyId}/branches/${branch.id}`);
      
      await update(branchRef, values);

      onBranchUpdated();
      setOpen(false);
      toast({
        title: 'Branch Updated',
        description: `The branch "${values.name}" has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating branch:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update branch',
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
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>
            Update the details for the {branch.name} branch.
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
                    Saving Changes...
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
