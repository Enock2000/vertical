// src/ai/flows/reject-applicant-flow.ts
'use server';

/**
 * @fileOverview Handles rejecting a job applicant, updating their status, and sending a notification email.
 * 
 * - rejectApplicant - A server action that processes the rejection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { createNotification } from '@/lib/data';

const RejectApplicantInputSchema = z.object({
  companyId: z.string(),
  applicantId: z.string(),
  applicantName: z.string(),
  applicantEmail: z.string().email(),
  jobTitle: z.string(),
  rejectionReason: z.string(),
  sendEmail: z.boolean(),
});

const RejectApplicantOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function rejectApplicant(
  input: z.infer<typeof RejectApplicantInputSchema>
): Promise<z.infer<typeof RejectApplicantOutputSchema>> {
  return rejectApplicantFlow(input);
}

const rejectApplicantFlow = ai.defineFlow(
  {
    name: 'rejectApplicantFlow',
    inputSchema: RejectApplicantInputSchema,
    outputSchema: RejectApplicantOutputSchema,
  },
  async ({ companyId, applicantId, applicantName, applicantEmail, jobTitle, rejectionReason, sendEmail }) => {
    try {
      // 1. Update applicant's status to 'Rejected'
      const applicantRef = ref(db, `companies/${companyId}/applicants/${applicantId}`);
      await update(applicantRef, {
        status: 'Rejected',
        rejectionReason: rejectionReason,
      });

      // 2. If sendEmail is true, simulate sending an email
      if (sendEmail) {
        // In a real application, you would integrate with an email service like SendGrid or Nodemailer.
        // For this example, we'll log to the console and create an in-app notification.
        console.log(`
          --- SIMULATING REJECTION EMAIL ---
          To: ${applicantEmail}
          Subject: Your application for ${jobTitle}
          
          Dear ${applicantName},
          
          ${rejectionReason}
          
          We wish you the best of luck in your job search.
          
          Sincerely,
          The Hiring Team
          ------------------------------------
        `);

        // Create an in-app notification for the applicant
        await createNotification(companyId, {
            userId: applicantId, // Assuming applicant ID might be the user ID
            title: `Update on your application for ${jobTitle}`,
            message: `After careful consideration, we have decided to move forward with other candidates. We wish you the best.`,
            link: '/applicant-portal',
        });
      }
      
      const emailMessage = sendEmail ? ' and a notification email has been sent.' : '.';
      return { success: true, message: `Applicant has been rejected${emailMessage}` };

    } catch (error: any) {
      console.error("Error rejecting applicant:", error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
