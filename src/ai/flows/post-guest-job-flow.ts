// src/ai/flows/post-guest-job-flow.ts
'use server';

/**
 * @fileOverview Handles job postings from non-registered guest companies, including account creation.
 * 
 * - handleGuestJobPosting - A function that processes a new guest job submission and creates a guest account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { Company, Employee, JobVacancy, ApplicationFormQuestion } from '@/lib/data';
import { add } from 'date-fns';

const customQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question cannot be empty.'),
  type: z.enum(['text', 'textarea', 'yesno']),
  required: z.boolean(),
});

const GuestJobInputSchema = z.object({
  companyName: z.string(),
  companyEmail: z.string().email(),
  password: z.string().min(6),
  title: z.string(),
  departmentName: z.string(),
  description: z.string(),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salary: z.coerce.number().optional(),
  jobType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Remote']).optional(),
  closingDate: z.string(),
  customForm: z.array(customQuestionSchema).optional(),
});

const GuestJobOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function handleGuestJobPosting(
  input: z.infer<typeof GuestJobInputSchema>
): Promise<z.infer<typeof GuestJobOutputSchema>> {
    return handleGuestJobPostingFlow(input);
}


const handleGuestJobPostingFlow = ai.defineFlow(
  {
    name: 'handleGuestJobPostingFlow',
    inputSchema: GuestJobInputSchema,
    outputSchema: GuestJobOutputSchema,
  },
  async ({ companyName, companyEmail, password, ...jobData }) => {
    try {
        // 1. Create a Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, companyEmail, password);
        const user = userCredential.user;

        // 2. Create a 'Guest' Company record
        const companyId = user.uid; // Use user's UID as company ID for guests
        const companyRef = ref(db, `companies/${companyId}`);
        const newCompany: Partial<Company> = {
            id: companyId,
            name: companyName,
            adminEmail: companyEmail,
            createdAt: new Date().toISOString(),
            status: 'Guest', // Special status for guests
             subscription: { // Minimal subscription for guests
                planId: 'guest',
                status: 'active',
                jobPostingsRemaining: 1, // Give them one post
                nextBillingDate: add(new Date(), { years: 1 }).toISOString(),
            },
        };
        await set(companyRef, newCompany);

        // 3. Create a corresponding 'GuestAdmin' employee record
        const employeeRef = ref(db, `employees/${user.uid}`);
        const newEmployee: Partial<Employee> = {
            id: user.uid,
            companyId: companyId,
            name: companyName, // Use company name as contact name for simplicity
            email: companyEmail,
            role: 'GuestAdmin',
            status: 'Active',
            joinDate: new Date().toISOString(),
        };
        await set(employeeRef, newEmployee);

        // 4. Create the Job Vacancy under this new guest company
        const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
        const newJobRef = push(jobsRef);
        const newGuestJob: Omit<JobVacancy, 'id'> = {
            ...jobData,
            companyId: companyId,
            departmentId: 'guest-dept',
            status: 'Pending', // All guest jobs start as pending
            createdAt: new Date().toISOString(),
            views: 0,
            customForm: jobData.customForm?.map(q => ({...q, id: push(ref(db)).key!})) || [],
        };
        await set(newJobRef, { ...newGuestJob, id: newJobRef.key });

        // In a real application, you might also notify a super admin for job approval.

        return { success: true, message: 'Your account has been created and your job has been submitted for review. You can now log in.' };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: 'An account with this email already exists. Please log in or use a different email.' };
        }
        console.error("Error submitting guest job posting:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
