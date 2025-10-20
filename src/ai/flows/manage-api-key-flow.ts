// src/ai/flows/manage-api-key-flow.ts
'use server';

/**
 * @fileOverview Manages API key generation and revocation for companies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { randomBytes } from 'crypto';

const ManageApiKeyInputSchema = z.object({
  companyId: z.string(),
  action: z.enum(['generate', 'revoke']),
});

const ManageApiKeyOutputSchema = z.object({
  success: z.boolean(),
  apiKey: z.string().optional(),
});

export async function manageApiKey(
  input: z.infer<typeof ManageApiKeyInputSchema>
): Promise<z.infer<typeof ManageApiKeyOutputSchema>> {
  return manageApiKeyFlow(input);
}

const manageApiKeyFlow = ai.defineFlow(
  {
    name: 'manageApiKeyFlow',
    inputSchema: ManageApiKeyInputSchema,
    outputSchema: ManageApiKeyOutputSchema,
  },
  async ({ companyId, action }) => {
    try {
      const companyRef = ref(db, `companies/${companyId}`);
      let apiKey: string | null = null;

      if (action === 'generate') {
        apiKey = `vrlsync_${randomBytes(24).toString('hex')}`;
        await update(companyRef, { apiKey: apiKey });
      } else if (action === 'revoke') {
        await update(companyRef, { apiKey: null });
      }

      return {
        success: true,
        apiKey: apiKey || undefined,
      };
    } catch (error: any) {
      console.error('Error managing API key:', error);
      return { success: false };
    }
  }
);
