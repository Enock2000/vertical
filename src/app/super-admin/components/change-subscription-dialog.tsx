
// src/app/super-admin/components/change-subscription-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import type { Company, SubscriptionPlan, CompanySubscription } from '@/lib/data';
import { format, add } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  planId: z.string().min(1, 'Please select a subscription plan.'),
  nextBillingDate: z.date({ required_error: 'A billing/trial end date is required.' }),
});

type ChangeSubscriptionFormValues = z.infer<typeof formSchema>;

interface ChangeSubscriptionDialogProps {
  children: React.ReactNode;
  company: Company;
  plans: SubscriptionPlan[];
}

export function ChangeSubscriptionDialog({ children, company, plans }: ChangeSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ChangeSubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      planId: company.subscription?.planId || '',
      nextBillingDate: company.subscription?.nextBillingDate ? new Date(company.subscription.nextBillingDate) : new Date(),
    },
  });

  async function onSubmit(values: ChangeSubscriptionFormValues) {
    setIsLoading(true);
    try {
        const selectedPlan = plans.find(p => p.id === values.planId);
        if (!selectedPlan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected plan not found.' });
            setIsLoading(false);
            return;
        }

        const companyRef = ref(db, `companies/${company.id}`);
        
        const newSubscription: CompanySubscription = {
            planId: selectedPlan.id,
            status: 'active',
            jobPostingsRemaining: selectedPlan.jobPostings,
            nextBillingDate: values.nextBillingDate.toISOString(),
            trialEndDate: company.subscription?.status === 'trial' ? values.nextBillingDate.toISOString() : company.subscription?.trialEndDate,
        };

        await update(companyRef, { subscription: newSubscription });

        setOpen(false);
        toast({
            title: 'Subscription Updated',
            description: `${company.name}'s plan has been updated.`,
        });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
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
          <DialogTitle>Change Subscription for {company.name}</DialogTitle>
          <DialogDescription>
            Select a new subscription plan and set the next billing date.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.price} ZMW/month, {plan.jobPostings} jobs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextBillingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Billing / Trial End Date</FormLabel>
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
