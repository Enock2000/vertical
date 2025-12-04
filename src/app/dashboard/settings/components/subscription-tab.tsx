// src/app/dashboard/settings/components/subscription-tab.tsx
'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import type { SubscriptionPlan, CompanySubscription } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { add } from 'date-fns';

interface SubscriptionTabProps {
  plans: SubscriptionPlan[];
}

export function SubscriptionTab({ plans }: SubscriptionTabProps) {
  const { company, companyId } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const currentPlanId = company?.subscription?.planId;

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
        email: company.adminEmail,
        customer: {
          firstName: company.contactName.split(' ')[0] || company.contactName,
          lastName: company.contactName.split(' ').slice(1).join(' ') || '',
          phone: company.contactNumber,
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
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>
          Choose a plan that fits your company's hiring needs.
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
  );
}
