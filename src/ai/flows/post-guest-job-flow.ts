// src/ai/flows/post-guest-job-flow.ts
'use server';

/**
 * @fileOverview Handles job postings from non-registered companies.
 * 
 * - handleGuestJobPosting - A function that processes a new guest job submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import type { GuestJobVacancy } from '@/lib/data';

const GuestJobInputSchema = z.object({
  companyName: z.string(),
  companyEmail: z.string().email(),
  title: z.string(),
  departmentName: z.string(),
  description: z.string(),
  closingDate: z.string(),
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
  async (jobData) => {
    try {
        const guestJobsRef = ref(db, 'guestJobVacancies');
        const newJobRef = push(guestJobsRef);

        const newGuestJob: Omit<GuestJobVacancy, 'id'> = {
            ...jobData,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };

        await set(newJobRef, { ...newGuestJob, id: newJobRef.key });

        // In a real application, you would also send a notification to the super admin here.

        return { success: true, message: 'Job posting submitted for review.' };

    } catch (error: any) {
        console.error("Error submitting guest job posting:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
