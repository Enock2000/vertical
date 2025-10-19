// src/ai/flows/logged-in-guest-job-flow.ts
'use server';

/**
 * @fileOverview Handles job postings from logged-in guest companies.
 * 
 * - handleLoggedInGuestJobPosting - A function that processes a new job submission from an existing guest account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import type { JobVacancy, ApplicationFormQuestion } from '@/lib/data';

const customQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question cannot be empty.'),
  type: z.enum(['text', 'textarea', 'yesno']),
  required: z.boolean(),
});

const LoggedInGuestJobInputSchema = z.object({
  companyId: z.string(),
  title: z.string(),
  departmentName: z.string(),
  description: z.string(),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salary: z.coerce.number().optional(),
  jobType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Remote']).optional(),
  closingDate: z.string(),
  applicationMethod: z.enum(['internal', 'email']).default('internal'),
  applicationEmail: z.string().email().optional().or(z.literal('')),
  customForm: z.array(customQuestionSchema).optional(),
}).refine(data => {
    if (data.applicationMethod === 'email' && !data.applicationEmail) {
        return false;
    }
    return true;
}, {
    message: "Application email is required for this method.",
    path: ['applicationEmail'],
});

const LoggedInGuestJobOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function handleLoggedInGuestJobPosting(
  input: z.infer<typeof LoggedInGuestJobInputSchema>
): Promise<z.infer<typeof LoggedInGuestJobOutputSchema>> {
    return handleLoggedInGuestJobPostingFlow(input);
}


const handleLoggedInGuestJobPostingFlow = ai.defineFlow(
  {
    name: 'handleLoggedInGuestJobPostingFlow',
    inputSchema: LoggedInGuestJobInputSchema,
    outputSchema: LoggedInGuestJobOutputSchema,
  },
  async ({ companyId, ...jobData }) => {
    try {
        // Create the Job Vacancy under the existing guest company
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

        return { success: true, message: 'Your job has been submitted for review.' };

    } catch (error: any) {
        console.error("Error submitting logged-in guest job posting:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
