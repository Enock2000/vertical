// src/app/dashboard/settings/components/billing-history.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { PaymentTransaction } from '@/lib/data';
import { format } from 'date-fns';

interface BillingHistoryProps {
    companyId: string;
}

export function BillingHistory({ companyId }: BillingHistoryProps) {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const txRef = ref(db, `companies/${companyId}/transactions`);
        const unsubscribe = onValue(txRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const txList = Object.values<PaymentTransaction>(data);
                // Sort by timestamp, newest first
                txList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setTransactions(txList);
            } else {
                setTransactions([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [companyId]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'ZMW',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'successful':
                return <Badge variant="default" className="bg-green-500">Successful</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentTypeLabel = (type: string | null) => {
        if (!type) return 'N/A';
        return type.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your payment transaction history</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your payment transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No transactions yet. Subscribe to a plan to see your billing history.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                    Your payment transaction history ({transactions.length} transaction{transactions.length !== 1 ? 's' : ''})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(tx.timestamp), 'MMM dd, yyyy')}
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(tx.timestamp), 'HH:mm')}
                                    </div>
                                </TableCell>
                                <TableCell>{tx.planName}</TableCell>
                                <TableCell className="font-semibold">
                                    {formatCurrency(tx.amount, tx.currency)}
                                </TableCell>
                                <TableCell>{getPaymentTypeLabel(tx.paymentType)}</TableCell>
                                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {tx.lencoReference}
                                    {tx.reasonForFailure && (
                                        <div className="text-destructive mt-1">
                                            {tx.reasonForFailure}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
