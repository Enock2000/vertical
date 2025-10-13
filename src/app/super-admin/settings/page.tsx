// src/app/super-admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdminSettingsPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [logoUrl, setLogoUrl] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        const settingsRef = ref(db, 'platformSettings/mainLogoUrl');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            setLogoUrl(snapshot.val() || '');
            setLoadingData(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await set(ref(db, 'platformSettings/mainLogoUrl'), logoUrl);
            toast({ title: 'Platform Logo Updated', description: 'The main logo for the application has been saved.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not update the platform logo.' });
        } finally {
            setIsSaving(false);
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
                        <div className='flex items-center gap-4'>
                            <Button variant="outline" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Platform Settings</CardTitle>
                                <CardDescription>
                                    Manage global settings for the VerticalSync platform.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="max-w-md space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="main-logo-url">Main Platform Logo URL</Label>
                            <Input 
                                id="main-logo-url" 
                                value={logoUrl} 
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/platform-logo.png"
                            />
                        </div>
                         {logoUrl && (
                            <div>
                                <Label>Logo Preview</Label>
                                <div className="mt-2 flex items-center justify-center rounded-md border p-4 h-32">
                                    <Image src={logoUrl} alt="Platform Logo Preview" width={100} height={100} className="object-contain" />
                                </div>
                            </div>
                        )}
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Save Platform Logo
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
