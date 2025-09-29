
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { PayrollConfig, Bank } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollSettingsTab } from './components/payroll-settings-tab';
import { BanksTab } from './components/banks-tab';
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

export default function SettingsPage() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<Bank[]>([]);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeNapsaRate: 5,
      employerNapsaRate: 5,
      employeeNhimaRate: 1,
      employerNhimaRate: 1,
      taxRate: 25,
      overtimeMultiplier: 1.5,
      dailyTargetHours: 8,
      weeklyTargetHours: 40,
      monthlyTargetHours: 160,
      yearlyTargetHours: 1920,
      allowedIpAddress: '',
    },
  });

  useEffect(() => {
    if (!companyId) return;
    
    const configRef = ref(db, `companies/${companyId}/payrollConfig`);
    const banksRef = ref(db, `companies/${companyId}/banks`);

    let configLoaded = false;
    let banksLoaded = false;

    const checkLoading = () => {
        if (configLoaded && banksLoaded) {
            setLoading(false);
        }
    }

    const configUnsubscribe = onValue(configRef, (snapshot) => {
      const data: PayrollConfig | null = snapshot.val();
      if (data) {
        form.reset({
            ...form.getValues(), // preserve defaults
            ...data,
            allowedIpAddress: data.allowedIpAddress || '',
        });
      }
      configLoaded = true;
      checkLoading();
    });

    const banksUnsubscribe = onValue(banksRef, (snapshot) => {
        const data = snapshot.val();
        setBanks(data ? Object.values(data) : []);
        banksLoaded = true;
        checkLoading();
    });

    return () => {
        configUnsubscribe();
        banksUnsubscribe();
    };
  }, [companyId, form]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
     <Tabs defaultValue="payroll">
        <TabsList className="mb-4">
            <TabsTrigger value="payroll">Payroll & Attendance</TabsTrigger>
            <TabsTrigger value="banks">Bank Management</TabsTrigger>
        </TabsList>
        <TabsContent value="payroll">
            <PayrollSettingsTab form={form} />
        </TabsContent>
        <TabsContent value="banks">
            <BanksTab banks={banks} />
        </TabsContent>
    </Tabs>
  );
}
