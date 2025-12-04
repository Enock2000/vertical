// src/app/force-password-reset/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import type { Employee } from '@/lib/data';

export default function ForcePasswordResetPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user, employee, loading } = useAuth();

    useEffect(() => {
        // Redirect if not logged in
        if (!loading && !user) {
            router.push('/employee-login');
        }
    }, [user, loading, router]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Password Too Short',
                description: 'Password must be at least 8 characters long.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords Do Not Match',
                description: 'Please ensure both passwords are the same.',
            });
            return;
        }

        setIsLoading(true);
        try {
            if (!user) {
                throw new Error('No user logged in');
            }

            // Update password in Firebase Auth
            await updatePassword(user, newPassword);

            // Clear the requirePasswordReset flag
            await update(ref(db, `employees/${user.uid}`), {
                requirePasswordReset: false,
            });

            toast({
                title: 'Password Updated Successfully',
                description: 'Your password has been changed. You can now access the portal.',
            });

            // Redirect to appropriate portal based on role
            if (employee?.role === 'Applicant') {
                router.push('/applicant-portal');
            } else if (employee?.role === 'GuestAdmin') {
                router.push('/guest-employer');
            } else {
                router.push('/employee-portal');
            }
        } catch (error: any) {
            console.error('Error resetting password:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/requires-recent-login') {
                toast({
                    variant: 'destructive',
                    title: 'Session Expired',
                    description: 'For security, please log out and log in again before changing your password.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to Update Password',
                    description: error.message || 'An unexpected error occurred. Please try again.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="mx-auto w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <Logo />
                    </div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <CardDescription>
                        {employee?.requirePasswordReset
                            ? "Your administrator has requested you to reset your password. Please set a new password to continue."
                            : "Please set a new password for your account."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum 8 characters
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Set New Password
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
