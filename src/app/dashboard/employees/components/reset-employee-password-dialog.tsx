// src/app/dashboard/employees/components/reset-employee-password-dialog.tsx
'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import type { Employee } from '@/lib/data';

interface ResetEmployeePasswordDialogProps {
    children: React.ReactNode;
    employee: Employee;
    onPasswordReset?: () => void;
}

export function ResetEmployeePasswordDialog({
    children,
    employee,
    onPasswordReset
}: ResetEmployeePasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleResetPassword = async () => {
        setIsLoading(true);
        try {
            // Send password reset email via Firebase
            await sendPasswordResetEmail(auth, employee.email);

            // Set requirePasswordReset flag so they must change password on next login
            await update(ref(db, `employees/${employee.id}`), {
                requirePasswordReset: true,
            });

            toast({
                title: 'Password Reset Email Sent',
                description: `A password reset link has been sent to ${employee.email}. They will be required to set a new password on their next login.`,
            });

            setOpen(false);
            onPasswordReset?.();
        } catch (error: any) {
            console.error('Error resetting password:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Reset Password',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Reset Password for {employee.name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will send a password reset email to <strong>{employee.email}</strong>.
                        <br /><br />
                        The employee will receive an email with a link to reset their password.
                        Additionally, they will be required to set a new password on their next login to the employee portal.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleResetPassword();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Email'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
