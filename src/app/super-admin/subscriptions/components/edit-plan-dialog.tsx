
// src/app/super-admin/subscriptions/components/edit-plan-dialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  jobPostings: z.coerce.number().int().min(0, 'Job postings must be a positive integer.'),
  features: z.string().min(3, 'Please list at least one feature.'),
});

type EditPlanFormValues = z.infer<typeof formSchema>;

interface EditPlanDialogProps {
  children: React.ReactNode;
  plan: SubscriptionPlan;
}

export function EditPlanDialog({ children, plan }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditPlanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plan.name,
      price: plan.price,
      jobPostings: plan.jobPostings,
      features: plan.features.join(', '),
    },
  });

  async function onSubmit(values: EditPlanFormValues) {
    setIsLoading(true);
    try {
      const planRef = ref(db, `subscriptionPlans/${plan.id}`);
      
      const updatedPlanData = {
          name: values.name,
          price: values.price,
          jobPostings: values.jobPostings,
          features: values.features.split(',').map(f => f.trim()),
      };

      await update(planRef, updatedPlanData);

      setOpen(false);
      toast({
        title: 'Plan Updated',
        description: `The subscription plan "${values.name}" has been updated.`,
      });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update plan',
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
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Modify the details for the "{plan.name}" plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic, Pro, Enterprise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (ZMW/month)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="jobPostings"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Job Postings</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter features, separated by commas" {...field} />
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
