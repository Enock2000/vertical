// src/app/dashboard/organization/components/add-shift-dialog.tsx
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
  name: z.string().min(2, 'Shift name must be at least 2 characters.'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format (#RRGGBB)"),
});

type AddShiftFormValues = z.infer<typeof formSchema>;

interface AddShiftDialogProps {
  children: React.ReactNode;
  onShiftAdded: () => void;
}

export function AddShiftDialog({
  children,
  onShiftAdded,
}: AddShiftDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddShiftFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startTime: '08:00',
      endTime: '17:00',
      color: '#3b82f6',
    },
  });

  async function onSubmit(values: AddShiftFormValues) {
    if (!companyId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Company not found.' });
        return;
    }
    setIsLoading(true);
    try {
      const shiftsRef = ref(db, `companies/${companyId}/shifts`);
      const newShiftRef = push(shiftsRef);
      
      await set(newShiftRef, {
        id: newShiftRef.key,
        ...values,
      });

      onShiftAdded();
      setOpen(false);
      form.reset();
      toast({
        title: 'Shift Added',
        description: `The shift "${values.name}" has been successfully created.`,
      });
    } catch (error: any) {
      console.error('Error adding shift:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add shift',
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
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>
            Enter the details for the new work shift.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                       <div className="flex items-center gap-2">
                         <Input type="color" className="w-12 h-10 p-1" {...field} />
                         <Input type="text" {...field} />
                       </div>
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
                  'Save Shift'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
