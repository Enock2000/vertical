// src/ai/flows/submit-resignation-flow.ts
'use server';

/**
 * @fileOverview Handles employee resignation requests.
 * 
 * - submitResignation - A server action that processes a new resignation request.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import type { ResignationRequest } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';

const ResignationRequestInputSchema = z.object({
  companyId: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  resignationDate: z.string().date(),
  reason: z.string().min(10, "A brief reason is required."),
});

const ResignationRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function submitResignation(
  input: z.infer<typeof ResignationRequestInputSchema>
): Promise<z.infer<typeof ResignationRequestOutputSchema>> {
  return submitResignationFlow(input);
}

const submitResignationFlow = ai.defineFlow(
  {
    name: 'submitResignationFlow',
    inputSchema: ResignationRequestInputSchema,
    outputSchema: ResignationRequestOutputSchema,
  },
  async (requestData) => {
    try {
      // 1. Create resignation request record in Realtime Database
      const resignationRequestsRef = dbRef(db, `companies/${requestData.companyId}/resignationRequests`);
      const newRequestRef = push(resignationRequestsRef);
      
      const newResignationRequest: Omit<ResignationRequest, 'id'> = {
          ...requestData,
          submissionDate: new Date().toISOString(),
          status: 'Pending',
      };

      await set(newRequestRef, { ...newResignationRequest, id: newRequestRef.key });
      
      // 2. Notify admins
      const adminIds = await getAdminUserIds(requestData.companyId);
      for (const adminId of adminIds) {
          await createNotification(requestData.companyId, {
              userId: adminId,
              title: 'New Resignation Request',
              message: `${requestData.employeeName} has submitted their resignation.`,
              link: '/dashboard/leave?tab=resignations',
          });
      }

      return { success: true, message: 'Resignation request submitted successfully.' };

    } catch (error: any) {
        console.error("Error submitting resignation request:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
