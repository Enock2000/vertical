// src/ai/flows/upgrade-guest-account-flow.ts
'use server';

/**
 * @fileOverview Handles the upgrade of a guest account to a full account pending review.
 * 
 * - upgradeGuestAccount - A server action that processes the upgrade request.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { getAdminUserIds, createNotification } from '@/lib/data';

const UpgradeGuestInputSchema = z.object({
  companyId: z.string(),
  tpin: z.string().min(5, "TPIN is required."),
  address: z.string().min(10, "A full address is required."),
  contactName: z.string().min(2, "Contact name is required."),
  contactNumber: z.string().min(9, "A valid phone number is required."),
});

const UpgradeGuestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function upgradeGuestAccount(
  input: z.infer<typeof UpgradeGuestInputSchema>
): Promise<z.infer<typeof UpgradeGuestOutputSchema>> {
    return upgradeGuestAccountFlow(input);
}

const upgradeGuestAccountFlow = ai.defineFlow(
  {
    name: 'upgradeGuestAccountFlow',
    inputSchema: UpgradeGuestInputSchema,
    outputSchema: UpgradeGuestOutputSchema,
  },
  async ({ companyId, ...updateData }) => {
    try {
        const companyRef = ref(db, `companies/${companyId}`);
        
        // Update company record with new details and set status to 'Pending'
        await update(companyRef, {
            ...updateData,
            status: 'Pending',
        });
        
        // In a real app, you would also notify super admins about the new upgrade request.
        
        return { success: true, message: 'Your account has been submitted for review.' };

    } catch (error: any) {
        console.error("Error upgrading guest account:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
