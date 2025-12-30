// src/app/dashboard/performance/components/add-certification-dialog.tsx
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Employee, Certification } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

const formSchema = z.object({
  name: z.string().min(3, 'Certification name is required.'),
  issuingBody: z.string().min(2, 'Issuing body is required.'),
  issueDate: z.date({ required_error: 'Issue date is required.' }),
  expiryDate: z.date().optional(),
});

type AddCertificationFormValues = z.infer<typeof formSchema>;

interface AddCertificationDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

export function AddCertificationDialog({ children, employee }: AddCertificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { companyId } = useAuth();

  const form = useForm<AddCertificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      issuingBody: '',
    },
  });

  async function onSubmit(values: AddCertificationFormValues) {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const certificationsRef = ref(db, 'certifications');
      const newCertRef = push(certificationsRef);

      const newCertification: Omit<Certification, 'id'> = {
        companyId: companyId,
        employeeId: employee.id,
        name: values.name,
        issuingBody: values.issuingBody,
        issueDate: values.issueDate.toISOString(),
        expiryDate: values.expiryDate?.toISOString() || null,
      };

      await set(newCertRef, newCertification);

      setOpen(false);
      form.reset();
      toast({
        title: 'Certification Added',
        description: `A new certification has been added for ${employee.name}.`,
      });
    } catch (error: any) {
      console.error("Error adding certification:", error);
      toast({
        variant: "destructive",
        title: "Failed to add certification",
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
          <DialogTitle>Add Certification for {employee.name}</DialogTitle>
          <DialogDescription>
            Record a new certification and its relevant dates.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Certified HR Professional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issuingBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuing Body</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HRCI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Issue Date</FormLabel>
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
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date (Optional)</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Certification'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
