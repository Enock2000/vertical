'use client';

import { useEffect, useState } from 'react';
import { Clock, Building2, LogOut, CheckCircle2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Logo from '@/components/logo';
import type { Company } from '@/lib/data';

export default function PendingApprovalPage() {
    const router = useRouter();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            // Listen to company status
            const companyRef = ref(db, `companies/${user.uid}`);
            const unsubscribeDb = onValue(companyRef, (snapshot) => {
                if (snapshot.exists()) {
                    const companyData = snapshot.val() as Company;
                    setCompany(companyData);

                    // If approved, redirect to dashboard
                    if (companyData.status === 'Active') {
                        router.push('/dashboard');
                    }
                }
                setLoading(false);
            });

            return () => unsubscribeDb();
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Clock className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Logo />
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader className="pb-4">
                        <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                            <Clock className="h-10 w-10 text-yellow-500" />
                        </div>
                        <CardTitle className="text-2xl">Registration Pending Approval</CardTitle>
                        <CardDescription className="text-base">
                            Your company registration is being reviewed by our team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Company Info */}
                        {company && (
                            <div className="bg-muted/50 rounded-lg p-4 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">{company.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>{company.adminEmail}</span>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-left">
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">Registration submitted successfully</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                <span className="text-sm">Approval in progress (up to 24 hours)</span>
                            </div>
                            <div className="flex items-center gap-3 text-left opacity-50">
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">Access to dashboard granted</span>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>What's next?</strong> Our team will review your company details and verify your documents.
                                You will receive an email notification once your account is approved.
                            </p>
                        </div>

                        {/* Contact */}
                        <div className="text-sm text-muted-foreground">
                            <p>Need help? Contact us at:</p>
                            <a href="mailto:support@verticalsync.com" className="text-primary hover:underline">
                                support@verticalsync.com
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} VerticalSync. All rights reserved.
            </footer>
        </div>
    );
}
