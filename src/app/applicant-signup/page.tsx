
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { Employee } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from "next/link";
import Logo from "@/components/logo";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignUpFormValues = z.infer<typeof formSchema>;

export default function ApplicantSignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
      const user = userCredential.user;

      // 2. Create an Employee record with role 'Applicant'
      const employeeRef = ref(db, `employees/${user.uid}`);
      const newApplicantProfile: Partial<Employee> = {
          id: user.uid,
          name: values.name,
          email: values.email,
          role: 'Applicant',
          status: 'Active',
          avatar: `https://avatar.vercel.sh/${values.email}.png`,
          joinDate: new Date().toISOString(),
          companyId: 'applicant-pool', // Special identifier for un-hired applicants
      };
      await set(employeeRef, newApplicantProfile);
      
      toast({
        title: "Account Created!",
        description: "You can now log in and build your profile.",
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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Create Profile
                    </Button>
                </form>
            </Form>
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
