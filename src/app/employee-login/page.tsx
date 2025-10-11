

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import type { Employee, Company, Applicant } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Logo from "@/components/logo";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function GeneralLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const employeeRef = ref(db, 'employees/' + user.uid);
      const employeeSnap = await get(employeeRef);

      if (employeeSnap.exists()) {
        const employee: Employee = employeeSnap.val();
        if (employee.status === 'Suspended' || employee.status === 'Inactive') {
            await auth.signOut(); 
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: `Your account is currently ${employee.status}. Please contact HR.`,
            });
            setIsLoading(false);
            return;
        }

        if (employee.role === 'Applicant') {
            router.push('/applicant-portal');
            return;
        }
        
        const companyRef = ref(db, 'companies/' + employee.companyId);
        const companySnap = await get(companyRef);
        if(companySnap.exists()) {
            const company: Company = companySnap.val();
            if(company.status === 'Suspended') {
                await auth.signOut();
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Your company's account has been suspended. Please contact your administrator.",
                });
                setIsLoading(false);
                return;
            }
        }
        router.push('/employee-portal');
        return;
      }
      
      await auth.signOut();
      toast({ variant: "destructive", title: "Login Failed", description: "No employee or applicant profile found for this account." });

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your credentials and try again.",
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
          <CardTitle className="text-2xl font-bold">Portal Login</CardTitle>
          <CardDescription>
            Employees and applicants can access their portal here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Are you an HR Admin?{" "}
            <Link href="/login" className="underline">
              Admin Login
            </Link>
          </div>
           <div className="mt-4 text-center text-sm">
            Don't have an applicant account?{" "}
            <Link href="/applicant-signup" className="underline">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
