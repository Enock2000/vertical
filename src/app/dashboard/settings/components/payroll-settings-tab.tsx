
// src/app/dashboard/settings/components/payroll-settings-tab.tsx
'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/auth-provider';

const formSchema = z.object({
  employeeNapsaRate: z.coerce.number().min(0).max(100),
  employerNapsaRate: z.coerce.number().min(0).max(100),
  employeeNhimaRate: z.coerce.number().min(0).max(100),
  employerNhimaRate: z.coerce.number().min(0).max(100),
  taxRate: z.coerce.number().min(0).max(100),
  overtimeMultiplier: z.coerce.number().min(1),
  // Attendance and working hours
  dailyTargetHours: z.coerce.number().min(1).max(24),
  weeklyTargetHours: z.coerce.number().min(1),
  monthlyTargetHours: z.coerce.number().min(1),
  yearlyTargetHours: z.coerce.number().min(1),
  allowedIpAddress: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface PayrollSettingsTabProps {
    form: UseFormReturn<SettingsFormValues>;
}

export function PayrollSettingsTab({ form }: PayrollSettingsTabProps) {
  const { companyId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  async function onSubmit(values: SettingsFormValues) {
    if (!companyId) return;
    setIsSaving(true);
    try {
      const newValues = {
        ...values,
        allowedIpAddress: values.allowedIpAddress || null, // Store as null if empty
      };
      await set(ref(db, `companies/${companyId}/payrollConfig`), newValues);
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
            <h3 className="text-lg font-medium">Statutory Contributions</h3>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="employeeNapsaRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employee NAPSA Rate (%)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="employerNapsaRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employer NAPSA Rate (%)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="employeeNhimaRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employee NHIMA Rate (%)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="employerNhimaRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employer NHIMA Rate (%)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <Separator />
            <h3 className="text-lg font-medium">Tax & Overtime</h3>
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
            
            <Separator />
            <h3 className="text-lg font-medium">Working Hours & Attendance</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="dailyTargetHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Daily Target Hours</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 8" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="weeklyTargetHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Weekly Target Hours</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 40" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="monthlyTargetHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Monthly Target Hours</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 160" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="yearlyTargetHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Yearly Target Hours</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1920" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
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
