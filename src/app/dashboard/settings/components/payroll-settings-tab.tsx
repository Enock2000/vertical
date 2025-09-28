// src/app/dashboard/settings/components/payroll-settings-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  napsaRate: z.coerce.number().min(0).max(100),
  nhimaRate: z.coerce.number().min(0).max(100),
  taxRate: z.coerce.number().min(0).max(100),
  overtimeMultiplier: z.coerce.number().min(1),
  workingHours: z.coerce.number().min(1).max(24),
  allowedIpAddress: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface PayrollSettingsTabProps {
    form: UseFormReturn<SettingsFormValues>;
}

export function PayrollSettingsTab({ form }: PayrollSettingsTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);
    try {
      const newValues = {
        ...values,
        allowedIpAddress: values.allowedIpAddress || null, // Store as null if empty
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll & Attendance</CardTitle>
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
                    <Input placeholder="e.g., 192.168.1.100" {...field} value={field.value ?? ''} />
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
