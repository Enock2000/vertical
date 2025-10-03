// src/app/dashboard/finance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/app/auth-provider';
import type { Product, Customer, Invoice, Transaction } from '@/lib/data';

export default function FinancePage() {
    const { companyId } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const refs = {
            products: ref(db, `companies/${companyId}/products`),
            customers: ref(db, `companies/${companyId}/customers`),
            invoices: ref(db, `companies/${companyId}/invoices`),
            transactions: ref(db, `companies/${companyId}/transactions`),
        };

        let loadedCount = 0;
        const totalToLoad = Object.keys(refs).length;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const createOnValueCallback = (setter: React.Dispatch<any>) => (snapshot: any) => {
            const data = snapshot.val();
            const list = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
            setter(list);
            checkLoading();
        };

        const onErrorCallback = (name: string) => (error: Error) => {
            console.error(`Firebase read failed for ${name}:`, error.message);
            checkLoading();
        };

        const unsubscribes = [
            onValue(refs.products, createOnValueCallback(setProducts), onErrorCallback('products')),
            onValue(refs.customers, createOnValueCallback(setCustomers), onErrorCallback('customers')),
            onValue(refs.invoices, createOnValueCallback(setInvoices), onErrorCallback('invoices')),
            onValue(refs.transactions, createOnValueCallback(setTransactions), onErrorCallback('transactions')),
        ];

        return () => unsubscribes.forEach(unsub => unsub());

    }, [companyId]);

     if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="overview">
            <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                {/* Overview content will go here */}
            </TabsContent>
            <TabsContent value="invoices">
                {/* Invoices content will go here */}
            </TabsContent>
             <TabsContent value="inventory">
                {/* Inventory content will go here */}
            </TabsContent>
             <TabsContent value="transactions">
                {/* Transactions content will go here */}
            </TabsContent>
        </Tabs>
    );
}
