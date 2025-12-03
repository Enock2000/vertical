// src/app/payment/cancel/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-orange-100 p-3">
                            <XCircle className="h-16 w-16 text-orange-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
                    <CardDescription>
                        Your payment was not completed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        No charges have been made to your account. You can try again anytime.
                    </p>
                    <div className="pt-4 space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/dashboard/settings">Try Again</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
