// src/app/dashboard/settings/components/subscription-tab.tsx
'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, HardDrive, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SubscriptionPlan, CompanySubscription } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { add } from 'date-fns';

interface SubscriptionTabProps {
  plans: SubscriptionPlan[];
  globalStorageLimitMB?: number;
}

export function SubscriptionTab({ plans, globalStorageLimitMB = 5120 }: SubscriptionTabProps) {
  const { company, companyId } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const currentPlanId = company?.subscription?.planId;
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const defaultLimitMB = currentPlan?.storageLimitMB || globalStorageLimitMB;
  const storageLimitMB = company?.overrideStorageLimitMB ?? defaultLimitMB;
  const storageUsedMB = Math.max(company?.storageUsedMB || 0, 0);
  const storagePercent = Math.min((storageUsedMB / storageLimitMB) * 100, 100);

  const formatStorageSize = (mb: number) => {
      if (mb < 1024) return `${mb.toFixed(1)} MB`;
      return `${(mb / 1024).toFixed(2)} GB`;
  };

  const handleChoosePlan = async (plan: SubscriptionPlan) => {
    if (!companyId || !company) return;
    setIsLoading(plan.id);

    try {
      // Check if Lenco Pay SDK is loaded
      if (typeof window === 'undefined' || !window.LencoPay) {
        toast({
          variant: 'destructive',
          title: 'Payment System Loading',
          description: 'Please wait a moment and try again.',
        });
        setIsLoading(null);
        return;
      }

      // Generate unique reference
      const reference = `vsync_sub_${companyId}_${plan.id}_${Date.now()}`;

      // Get public key from environment
      const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;
      if (!publicKey) {
        toast({
          variant: 'destructive',
          title: 'Configuration Error',
          description: 'Payment gateway is not configured.',
        });
        setIsLoading(null);
        return;
      }

      // Initiate Lenco Pay checkout
      window.LencoPay.getPaid({
        key: publicKey,
        amount: plan.price,
        currency: 'ZMW',
        reference,
        email: company.adminEmail || '',
        customer: {
          firstName: company.contactName?.split(' ')[0] || company.name || 'Customer',
          lastName: company.contactName?.split(' ').slice(1).join(' ') || '',
          phone: company.contactNumber || '',
        },
        // Enable both card and mobile money
        channels: ['card', 'mobile-money'],

        onSuccess: async (response) => {
          console.log('Payment successful:', response);

          // Verify payment with backend
          try {
            const verifyRes = await fetch(
              `/api/payment/verify?reference=${encodeURIComponent(response.reference)}`
            );
            const verifyData = await verifyRes.json();

            if (verifyData.success && verifyData.data.status === 'successful') {
              toast({
                title: 'Payment Successful!',
                description: `Your ${plan.name} subscription is now active.`,
              });

              // Redirect to success page
              window.location.href = `/payment/success?reference=${response.reference}`;
            } else {
              toast({
                variant: 'destructive',
                title: 'Payment Verification Failed',
                description: 'Please contact support if your payment was deducted.',
              });
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast({
              title: 'Payment Received',
              description: 'We\'re verifying your payment. This may take a moment.',
            });
          }
        },

        onClose: () => {
          setIsLoading(null);
          toast({
            title: 'Payment Cancelled',
            description: 'You can try again anytime.',
          });
        },
      });

    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Could not initiate payment. Please try again.',
      });
      setIsLoading(null);
    }
  };

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
                <CardTitle>Storage Quota</CardTitle>
                <CardDescription>Monitor your cloud file storage usage across the platform.</CardDescription>
            </div>
            <HardDrive className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>{formatStorageSize(storageUsedMB)} Used</span>
                    <span className="text-muted-foreground">{formatStorageSize(storageLimitMB)} Total</span>
                </div>
                <Progress 
                    value={storagePercent} 
                    className={`h-2 ${storagePercent > 90 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''}`} 
                />
            </div>
            {storagePercent >= 90 && (
                <Alert variant="destructive" className="mt-4 bg-destructive/10 text-destructive border-none">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Storage Space Running Out</AlertTitle>
                    <AlertDescription>
                        You have used {storagePercent.toFixed(0)}% of your available storage capacity. Please upgrade your subscription to increase your limit, or delete unused files.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Choose a plan that fits your company's hiring and storage needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{currencyFormatter.format(plan.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="font-semibold">{plan.jobPostings} job postings included</p>
              <p className="font-semibold text-primary">{formatStorageSize(plan.storageLimitMB || 5120)} file storage</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0">
              <Button
                className="w-full"
                onClick={() => handleChoosePlan(plan)}
                disabled={isLoading !== null || currentPlanId === plan.id}
              >
                {isLoading === plan.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : currentPlanId === plan.id ? (
                  'Current Plan'
                ) : (
                  'Choose Plan'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
    </div>
  );
}
