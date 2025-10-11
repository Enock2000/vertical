// src/app/applicant-signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { Employee } from '@/lib/data';
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

export default function ApplicantSignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create an Employee record with role 'Applicant'
      const employeeRef = ref(db, `employees/${user.uid}`);
      const newApplicantProfile: Partial<Employee> = {
          id: user.uid,
          name: name,
          email: email,
          role: 'Applicant',
          status: 'Active', // Applicant profiles are active by default
          avatar: `https://avatar.vercel.sh/${email}.png`,
          joinDate: new Date().toISOString(),
      };
      await set(employeeRef, newApplicantProfile);
      
      toast({
        title: "Account Created!",
        description: "You can now log in to the applicant portal.",
      });
      router.push('/applicant-portal');

    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Create Applicant Profile</CardTitle>
          <CardDescription>
            Sign up to apply for jobs and track your application status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Profile'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/employee-login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
