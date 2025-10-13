// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import type { PayrollConfig, Bank, SubscriptionPlan } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollSettingsTab } from './components/payroll-settings-tab';
import { BanksTab } from './components/banks-tab';
import { useAuth } from '@/app/auth-provider';
import { SubscriptionTab } from './components/subscription-tab';
import { TestimonialsTab } from './components/testimonials-tab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

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

function GeneralSettingsTab() {
  const { company, companyId } = useAuth();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLogoUrl(company?.logoUrl || '');
  }, [company]);
  

  const handleSaveLogo = async () => {
    if (!companyId) return;
    setIsSaving(true);
    try {
      await update(dbRef(db, `companies/${companyId}`), { logoUrl: logoUrl });
      toast({ title: "Logo URL saved successfully!" });
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Failed to save logo URL." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage general company information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="logo-url">Company Logo URL</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="logo-url" 
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <Button onClick={handleSaveLogo} disabled={isSaving} size="sm">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              <span className="sr-only">Save</span>
            </Button>
          </div>
        </div>
         {logoUrl && (
          <div>
            <Label>Logo Preview</Label>
            <div className="mt-2 flex items-center justify-center rounded-md border p-4 h-32">
              <Image src={logoUrl} alt="Company Logo Preview" width={100} height={100} className="object-contain" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
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
    
    const configRef = dbRef(db, `companies/${companyId}/payrollConfig`);
    const banksRef = dbRef(db, `companies/${companyId}/banks`);
    const plansRef = dbRef(db, 'subscriptionPlans');

    let configLoaded = false;
    let banksLoaded = false;
    let plansLoaded = false;

    const checkLoading = () => {
        if (configLoaded && banksLoaded && plansLoaded) {
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
    
    const plansUnsubscribe = onValue(plansRef, (snapshot) => {
        const data = snapshot.val();
        setSubscriptionPlans(data ? Object.values(data) : []);
        plansLoaded = true;
        checkLoading();
    });

    return () => {
        configUnsubscribe();
        banksUnsubscribe();
        plansUnsubscribe();
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
     <Tabs defaultValue="general">
        <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payroll">Payroll & Attendance</TabsTrigger>
            <TabsTrigger value="banks">Bank Management</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <GeneralSettingsTab />
        </TabsContent>
        <TabsContent value="payroll">
            <PayrollSettingsTab form={form} />
        </TabsContent>
        <TabsContent value="banks">
            <BanksTab banks={banks} />
        </TabsContent>
         <TabsContent value="subscription">
            <SubscriptionTab plans={subscriptionPlans} />
        </TabsContent>
         <TabsContent value="testimonials">
            <TestimonialsTab />
        </TabsContent>
    </Tabs>
  );
}
