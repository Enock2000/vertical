
// src/app/verify-2fa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Logo from "@/components/logo";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Verify2FAPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, employee, loading } = useAuth();

  useEffect(() => {
    // If user is not logged in or doesn't have 2FA, redirect them away
    if (!loading && (!user || !employee?.isTwoFactorEnabled)) {
        router.push('/login');
    }
  }, [user, employee, loading, router]);


  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real app, this code would be verified against the user's secret on the backend.
    // For this UI demonstration, we will accept any 6-digit code to allow navigation.
    if (code.length === 6 && /^\d+$/.test(code)) {
        toast({
            title: 'Verification Successful',
            description: 'You are now logged in.',
        });
        
        // Redirect to the appropriate portal based on role
        if (employee?.role === 'Super Admin') {
            router.push('/super-admin');
        } else if (employee?.role === 'Admin') {
            router.push('/dashboard');
        } else if (employee?.role === 'GuestAdmin') {
            router.push('/guest-employer');
        } else if (employee?.role === 'Applicant') {
            router.push('/applicant-portal');
        } else {
            router.push('/employee-portal');
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: 'The code you entered is incorrect. Please try again.',
        });
        setIsLoading(false);
    }
  };

  if (loading || !user || !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the code from your Google Authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                type="text"
                placeholder="123456"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
