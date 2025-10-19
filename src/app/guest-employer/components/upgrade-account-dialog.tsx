// src/app/guest-employer/components/upgrade-account-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { upgradeGuestAccount } from '@/ai/flows/upgrade-guest-account-flow';

const formSchema = z.object({
  tpin: z.string().min(5, "TPIN is required."),
  address: z.string().min(10, "A full address is required."),
  contactName: z.string().min(2, "Contact name is required."),
  contactNumber: z.string().min(9, "A valid phone number is required."),
});

type UpgradeFormValues = z.infer<typeof formSchema>;

export function UpgradeAccountDialog({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpgradeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tpin: company?.tpin || '',
      address: company?.address || '',
      contactName: company?.contactName || '',
      contactNumber: company?.contactNumber || '',
    },
  });

  const onSubmit = async (values: UpgradeFormValues) => {
    if (!company) return;
    setIsLoading(true);

    try {
      const result = await upgradeGuestAccount({ companyId: company.id, ...values });
      if (result.success) {
        toast({
          title: "Upgrade Request Submitted",
          description: "Your account details have been submitted for review. You will be notified upon approval.",
        });
        setOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Submission Failed', description: result.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to a Full Account</DialogTitle>
          <DialogDescription>
            Please provide your full company details to complete your registration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tpin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company TPIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your TPIN" {...field} />
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
                  <FormLabel>Full Company Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Plot 123, Main Street, Lusaka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrator Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrator Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+260 977 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit for Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}