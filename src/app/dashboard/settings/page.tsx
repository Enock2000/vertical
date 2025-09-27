'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { PayrollConfig } from '@/lib/data';

const formSchema = z.object({
  napsaRate: z.coerce.number().min(0).max(100),
  nhimaRate: z.coerce.number().min(0).max(100),
  taxRate: z.coerce.number().min(0).max(100),
  overtimeMultiplier: z.coerce.number().min(1),
  workingHours: z.coerce.number().min(1).max(24),
  allowedIpAddress: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      napsaRate: 5,
      nhimaRate: 1,
      taxRate: 25,
      overtimeMultiplier: 1.5,
      workingHours: 8,
      allowedIpAddress: '',
    },
  });

  useEffect(() => {
    const configRef = ref(db, 'payrollConfig');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data: PayrollConfig | null = snapshot.val();
      if (data) {
        // Ensure allowedIpAddress is a string to prevent controlled/uncontrolled error
        form.reset({
            ...data,
            allowedIpAddress: data.allowedIpAddress || '',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [form]);

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);
    try {
      const newValues = {
        ...values,
        allowedIpAddress: values.allowedIpAddress || '',
      };
      await set(ref(db, 'payrollConfig'), newValues);
      toast({
        title: 'Settings Saved',
        description: 'Your payroll configuration has been updated.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll & Attendance Settings</CardTitle>
        <CardDescription>
          Configure the parameters for payroll and attendance calculations. Rates should be entered as percentages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Tax Rate (PAYE %)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="napsaRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NAPSA Contribution Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nhimaRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NHIMA Contribution Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overtimeMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overtime Multiplier</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Working Hours</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 8" {...field} />
                  </FormControl>
                   <FormDescription>
                    The number of hours an employee is expected to work per day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="allowedIpAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed IP Address for Clock-In</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 192.168.1.100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to allow clock-in from any IP address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
