
// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { PayrollConfig, Bank, SubscriptionPlan } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollSettingsTab } from './components/payroll-settings-tab';
import { BanksTab } from './components/banks-tab';
import { useAuth } from '@/app/auth-provider';
import { SubscriptionTab } from './components/subscription-tab';
import { TestimonialsTab } from './components/testimonials-tab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  const { companyId } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyId) return;
    setIsUploading(true);
    try {
      const fileRef = storageRef(storage, `logos/${companyId}/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const logoUrl = await getDownloadURL(snapshot.ref);
      await update(dbRef(db, `companies/${companyId}`), { logoUrl });
      toast({ title: "Logo uploaded successfully!" });
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Failed to upload logo." });
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage general company information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div>
          <Label className="text-sm font-medium">Company Logo</Label>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex-1">
                <Label htmlFor="logo-upload" className={cn("w-full flex items-center justify-center gap-2", buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                    {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    <span>{isUploading ? 'Uploading...' : 'Choose Logo'}</span>
                </Label>
                <Input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} className="hidden"/>
            </div>
          </div>
        </div>
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
