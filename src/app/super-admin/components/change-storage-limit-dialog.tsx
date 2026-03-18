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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, HardDrive } from 'lucide-react';
import type { Company, SubscriptionPlan } from '@/lib/data';

const formSchema = z.object({
  overrideStorageLimitMB: z.coerce.number().int().min(0, 'Storage limit must be a positive integer.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangeStorageLimitDialogProps {
  children: React.ReactNode;
  company: Company;
  plans: SubscriptionPlan[];
}

export function ChangeStorageLimitDialog({ children, company, plans }: ChangeStorageLimitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === company.subscription.planId);
  const defaultLimit = currentPlan?.storageLimitMB || 5120;
  
  // By default, if they don't have an override, we show the plan's default so they know what they are starting from.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      overrideStorageLimitMB: company.overrideStorageLimitMB ?? defaultLimit,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const companyRef = ref(db, `companies/${company.id}`);
      
      // If the admin sets the limit EXACTLY back to the default plan limit, we could just remove the override.
      // But keeping it as an explicit override is also fine.
      const isDefault = values.overrideStorageLimitMB === defaultLimit;
      
      await update(companyRef, { 
          overrideStorageLimitMB: isDefault ? null : values.overrideStorageLimitMB 
      });

      setOpen(false);
      toast({
        title: 'Storage Limit Updated',
        description: `Custom storage limit for ${company.name} has been set to ${values.overrideStorageLimitMB} MB.`,
      });
    } catch (error: any) {
      console.error('Error updating storage limit:', error);
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
          <DialogTitle>Custom Storage Quota</DialogTitle>
          <DialogDescription>
            Override the default storage limit for <strong>{company.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="overrideStorageLimitMB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Limit (MB)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <HardDrive className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Base plan ({currentPlan?.name || 'Unknown'}) provides {defaultLimit} MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => form.setValue('overrideStorageLimitMB', defaultLimit)}>
                  Reset to Default
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Quota'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
