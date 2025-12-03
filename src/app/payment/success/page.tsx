// src/app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Optionally verify payment status
        if (reference) {
            setVerifying(true);
            fetch('/api/payment/verify-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ collectionId: reference }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log('Payment verification:', data);
                })
                .catch((error) => {
                    console.error('Error verifying payment:', error);
                })
                .finally(() => {
                    setVerifying(false);
                });
        }
    }, [reference]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                    <CardDescription>
                        Your subscription has been activated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {verifying ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Verifying payment...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Thank you for subscribing! You now have access to all premium features.
                            </p>
                            {reference && (
                                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    <strong>Reference:</strong> {reference}
                                </div>
                            )}
                        </>
                    )}
                    <div className="pt-4 space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/settings">View Subscription</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
