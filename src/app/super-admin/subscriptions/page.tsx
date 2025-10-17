
// src/app/super-admin/subscriptions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, PlusCircle, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import type { SubscriptionPlan } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddPlanDialog } from './components/add-plan-dialog';
import { EditPlanDialog } from './components/edit-plan-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

export default function SuperAdminSubscriptionsPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        const plansRef = ref(db, 'subscriptionPlans');
        const unsubscribe = onValue(plansRef, (snapshot) => {
            const data = snapshot.val();
            setPlans(data ? Object.values(data) : []);
            setLoadingData(false);
        }, (error) => {
            console.error(error);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, []);
    
    const handleDeleteConfirm = async () => {
        if (!planToDelete) return;
        try {
            await remove(ref(db, `subscriptionPlans/${planToDelete.id}`));
            toast({ title: 'Plan Deleted', description: `The "${planToDelete.name}" plan has been deleted.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete plan.' });
        } finally {
            setPlanToDelete(null);
        }
    };

    if (authLoading || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!employee || employee.role !== 'Super Admin') return null;
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                             <Button variant="outline" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                             </Button>
                            <div>
                                <CardTitle>Subscription Plans</CardTitle>
                                <CardDescription>
                                    Manage pricing plans for company job postings.
                                </CardDescription>
                            </div>
                        </div>
                        <AddPlanDialog>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-3.5 w-3.5" />
                                Add New Plan
                            </Button>
                        </AddPlanDialog>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plan Name</TableHead>
                                    <TableHead>Price (Monthly)</TableHead>
                                    <TableHead>Job Postings</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.name}</TableCell>
                                        <TableCell>{currencyFormatter.format(plan.price)}</TableCell>
                                        <TableCell>{plan.jobPostings}</TableCell>
                                        <TableCell>{plan.features.join(', ')}</TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <EditPlanDialog plan={plan}>
                                                            <div className="w-full">Edit</div>
                                                        </EditPlanDialog>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setPlanToDelete(plan)} className="text-destructive">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                             </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         {planToDelete && (
                            <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the <strong>{planToDelete.name}</strong> subscription plan.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
