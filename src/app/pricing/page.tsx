
// src/app/pricing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { SubscriptionPlan } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '@/components/logo';

export default function PricingPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const plansRef = ref(db, 'subscriptionPlans');
        const unsubscribe = onValue(plansRef, (snapshot) => {
            const data = snapshot.val();
            setPlans(data ? Object.values(data) : []);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12 md:py-20">
                <div className="container">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Find a Plan That's Right For You</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            Simple, transparent pricing. No hidden fees. Choose the plan that best fits your company's needs.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>
                    ) : (
                        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => (
                                <Card key={plan.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>
                                            <span className="text-4xl font-bold">{currencyFormatter.format(plan.price)}</span>
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
                                    <CardContent>
                                        <Button className="w-full" asChild>
                                            <Link href="/signup">Get Started</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
