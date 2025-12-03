// src/app/dashboard/settings/components/payment-method-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import type { CompanySubscription } from '@/lib/data';

interface PaymentMethodCardProps {
    subscription: CompanySubscription | null;
}

export function PaymentMethodCard({ subscription }: PaymentMethodCardProps) {
    if (!subscription?.paymentMethod) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                        No payment method on file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Subscribe to a paid plan to add a payment method.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { type, brand, last4, operator, phone } = subscription.paymentMethod;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                    Your active payment method
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {type === 'card' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <CreditCard className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-medium">
                                {brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : 'Credit Card'}
                            </p>
                            {last4 && (
                                <p className="text-sm text-muted-foreground">
                                    •••• •••• •••• {last4}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {type === 'mobile-money' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Smartphone className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-medium">{operator || 'Mobile Money'}</p>
                            {phone && (
                                <p className="text-sm text-muted-foreground">{phone}</p>
                            )}
                        </div>
                    </div>
                )}

                {type === 'bank-account' && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-medium">Bank Account</p>
                            <p className="text-sm text-muted-foreground">Direct bank transfer</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
