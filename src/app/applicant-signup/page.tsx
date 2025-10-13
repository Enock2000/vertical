
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { Employee } from '@/lib/data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Logo from "@/components/logo";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { EmployeeForm, employeeFormSchema, type EmployeeFormValues } from '../dashboard/employees/components/employee-form';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ApplicantSignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      gender: undefined,
      dateOfBirth: '',
      identificationType: undefined,
      identificationNumber: '',
      role: 'Applicant',
      status: 'Active',
      workerType: 'Salaried',
      salary: 0,
      annualLeaveBalance: 0,
      departmentId: 'unassigned', 
      location: '',
      hourlyRate: 0,
      hoursWorked: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      reimbursements: 0,
      bankName: '',
      accountNumber: '',
      branchCode: '',
      branchId: '',
      contractType: 'Permanent',
      contractStartDate: '',
      contractEndDate: '',
    },
  });

  const onSubmit = async (values: EmployeeFormValues) => {
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
      const user = userCredential.user;

      const { password, ...employeeData } = values;

      // 2. Create an Employee record with role 'Applicant'
      const employeeRef = ref(db, `employees/${user.uid}`);
      const newApplicantProfile: Partial<Employee> = {
          ...employeeData,
          id: user.uid,
          avatar: `https://avatar.vercel.sh/${values.email}.png`,
          joinDate: new Date().toISOString(),
          companyId: 'applicant-pool', // Special identifier for un-hired applicants
          departmentName: 'N/A',
      };
      await set(employeeRef, newApplicantProfile);
      
      toast({
        title: "Account Created!",
        description: "You can now log in and apply for jobs.",
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
      <Card className="mx-auto w-full max-w-lg shadow-2xl">
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
            <ScrollArea className="max-h-[60vh] pr-4">
                <EmployeeForm
                    form={form}
                    onSubmit={onSubmit}
                    isSubmitting={isLoading}
                    submitButtonText="Create Profile"
                    showAccountFields={true}
                    isApplicantForm={true}
                    // Pass empty arrays as they are not needed for this form
                    departments={[]}
                    branches={[]}
                    banks={[]}
                />
            </ScrollArea>
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
