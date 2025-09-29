// src/app/finish-login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee } from '@/lib/data';

export default function FinishLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your sign-in link...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finishSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          // User opened the link on a different device. To prevent session fixation
          // attacks, ask the user to provide the email again.
          // For simplicity, we'll show an error. In a real app, you'd prompt for it.
          setError('Your email is not available in this browser. Please try signing in again from the same device.');
          setMessage('Authentication failed.');
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          
          setMessage('Sign-in successful! Redirecting...');
          
          // Check user role and redirect accordingly
          const employeeRef = ref(db, 'employees/' + result.user.uid);
          const snapshot = await get(employeeRef);
          
          if (snapshot.exists()) {
              const employee: Employee = snapshot.val();
              if (employee.role === 'Admin') {
                  router.push('/dashboard');
              } else {
                  router.push('/employee-portal');
              }
          } else {
              // This case should ideally not happen in this app's context
              // but as a fallback, we redirect to a generic page.
              router.push('/');
          }

        } catch (err: any) {
          console.error(err);
          setError('The sign-in link is invalid or has expired. Please try again.');
          setMessage('Authentication failed.');
          toast({
            variant: 'destructive',
            title: 'Sign-in Failed',
            description: 'The link may be expired or invalid.',
          });
        }
      } else {
        setError('This is not a valid sign-in link.');
        setMessage('Invalid Link');
      }
    };

    finishSignIn();
  }, [router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Completing Sign-In</CardTitle>
          <CardDescription>
            Please wait while we securely sign you in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {!error && <Loader2 className="h-8 w-8 animate-spin" />}
          <p className={error ? "text-destructive" : "text-muted-foreground"}>
            {message}
          </p>
          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
