'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { Company, Employee } from '@/lib/data';
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

export default function SignUpPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyTpin, setCompanyTpin] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
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

      // 2. Create Company Profile in Realtime Database
      // The company ID will be the UID of the admin who created it.
      const companyId = user.uid; 
      const companyRef = ref(db, `companies/${companyId}`);
      const newCompany: Company = {
        id: companyId,
        name: companyName,
        tpin: companyTpin,
        address: companyAddress,
        contactName: contactName,
        contactNumber: contactNumber,
        adminEmail: email,
        createdAt: new Date().toISOString(),
      };
      await set(companyRef, newCompany);

      // 3. Create an initial Admin Employee record for the new user
      const employeeRef = ref(db, `employees/${user.uid}`);
      const newEmployee: Omit<Employee, 'id'> = {
        companyId: companyId,
        name: contactName,
        email: email,
        role: 'Admin', // The first user is always an Admin
        status: 'Active',
        avatar: `https://avatar.vercel.sh/${email}.png`,
        location: '',
        departmentId: 'admin',
        departmentName: 'Administration',
        workerType: 'Salaried',
        salary: 0,
        hourlyRate: 0,
        hoursWorked: 0,
        allowances: 0,
        deductions: 0,
        overtime: 0,
        bonus: 0,
        reimbursements: 0,
        joinDate: new Date().toISOString(),
        annualLeaveBalance: 21,
      };
      await set(employeeRef, {
        ...newEmployee,
        id: user.uid,
      });

      toast({
        title: "Account Created!",
        description: "Your company profile and admin account have been successfully created.",
      });
      router.push('/dashboard');

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
      <Card className="mx-auto w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Create a Company Account</CardTitle>
          <CardDescription>
            Enter your company's information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Acme Inc." required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-tpin">Company TPIN</Label>
                    <Input id="company-tpin" placeholder="123456789" required value={companyTpin} onChange={(e) => setCompanyTpin(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Input id="company-address" placeholder="123 Main St, Anytown, USA" required value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Your Admin Email</Label>
              <Input id="email" type="email" placeholder="you@acme.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Your Full Name</Label>
              <Input id="contact-name" placeholder="John Doe" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-number">Your Contact Number</Label>
              <Input id="contact-number" type="tel" placeholder="+1 234 567 890" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
