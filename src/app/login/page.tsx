

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import type { Company, Employee } from '@/lib/data';

export default function LoginPage() {
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

      if (!employeeSnap.exists()) {
        await auth.signOut();
        toast({ variant: "destructive", title: "Login Failed", description: "No employee profile found." });
        setIsLoading(false);
        return;
      }
      
      const employee: Employee = employeeSnap.val();
      
      if (employee.role !== 'Admin' && employee.role !== 'Super Admin') {
          await auth.signOut();
          toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You do not have permission to access the admin portal. Please use the Employee or Guest portal.",
          });
          setIsLoading(false);
          return;
      }
      
      // Check for 2FA
      if (employee.isTwoFactorEnabled) {
          router.push('/verify-2fa');
          return; // Stop execution here, let the 2FA page handle the rest
      }


      if (employee.role === 'Super Admin') {
          router.push('/super-admin');
          return;
      }

      // Check company status for Admin users
      const companyRef = ref(db, 'companies/' + employee.companyId);
      const companySnap = await get(companyRef);

      if (!companySnap.exists()) {
          await auth.signOut();
          toast({ variant: "destructive", title: "Login Failed", description: "Associated company not found." });
          setIsLoading(false);
          return;
      }

      const company: Company = companySnap.val();

      if (company.status === 'Pending') {
          await auth.signOut();
          toast({ variant: "destructive", title: "Account Pending", description: "Your company's registration is still under review." });
      } else if (company.status === 'Rejected') {
          await auth.signOut();
          toast({ variant: "destructive", title: "Access Denied", description: "Your company's registration has been rejected." });
      } else if (company.status === 'Suspended') {
          await auth.signOut();
          toast({ variant: "destructive", title: "Account Suspended", description: "This company account has been suspended. Please contact support." });
      } else {
          // If company is Active and user is Admin, proceed to dashboard
          router.push('/dashboard');
      }

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your email and password and try again.",
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
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Enter your email and password to log in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/portals" className="underline flex items-center justify-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to portal selection
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
