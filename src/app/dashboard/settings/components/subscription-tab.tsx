// src/app/dashboard/settings/components/subscription-tab.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
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
    if (!companyId) return;
    setIsLoading(plan.id);
    try {
      const companyRef = ref(db, `companies/${companyId}`);
      const newSubscription: CompanySubscription = {
        planId: plan.id,
        status: 'active',
        jobPostingsRemaining: plan.jobPostings,
        nextBillingDate: add(new Date(), { months: 1 }).toISOString(),
      };

      // In a real app, this would redirect to a payment provider (Stripe, etc.)
      // For this simulation, we'll just update the plan directly.
      await update(companyRef, { subscription: newSubscription });

      toast({
        title: 'Plan Updated!',
        description: `You have successfully subscribed to the ${plan.name} plan.`,
      });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your subscription.',
      });
    } finally {
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
