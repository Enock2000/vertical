// src/app/super-admin/testimonials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { Loader2, ArrowLeft, MoreHorizontal, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import type { Testimonial } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function SuperAdminWhoWeServePage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        const testimonialsRef = ref(db, 'testimonials');
        const unsubscribe = onValue(testimonialsRef, (snapshot) => {
            const data = snapshot.val();
            setTestimonials(data ? Object.values(data) : []);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (testimonialId: string, status: 'Approved' | 'Rejected') => {
        try {
            await update(ref(db, `testimonials/${testimonialId}`), { status });
            toast({ title: 'Status Updated', description: `Testimonial has been ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };

    const handleDelete = async (testimonialId: string) => {
         try {
            await remove(ref(db, `testimonials/${testimonialId}`));
            toast({ title: 'Testimonial Deleted', description: 'The testimonial has been removed.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete testimonial.' });
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

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Logo />
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                             <div className='flex items-center gap-4'>
                                <Button variant="outline" size="icon" onClick={() => router.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle>Who We Serve Management</CardTitle>
                                    <CardDescription>
                                        Approve or reject testimonials to be displayed on the "Who We Serve" page.
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Testimonial</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testimonials.map((testimonial) => (
                                    <TableRow key={testimonial.id}>
                                        <TableCell>{testimonial.companyName}</TableCell>
                                        <TableCell>{testimonial.authorName} <span className="text-muted-foreground">({testimonial.authorTitle})</span></TableCell>
                                        <TableCell className="max-w-md truncate">{testimonial.testimonialText}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                testimonial.status === 'Approved' ? 'default' :
                                                testimonial.status === 'Rejected' ? 'destructive' :
                                                'secondary'
                                            }>
                                                {testimonial.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(testimonial.id, 'Approved')}>
                                                        <Check className="mr-2 h-4 w-4" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(testimonial.id, 'Rejected')}>
                                                        <X className="mr-2 h-4 w-4" /> Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(testimonial.id)} className="text-red-600">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
