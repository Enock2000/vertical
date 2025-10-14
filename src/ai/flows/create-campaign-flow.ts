// src/ai/flows/create-campaign-flow.ts
'use server';

/**
 * @fileOverview Handles the creation of email campaigns via Brevo.
 * 
 * - createEmailCampaign - Creates and schedules an email marketing campaign.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as Brevo from '@getbrevo/brevo';

const CampaignSenderSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const CampaignRecipientsSchema = z.object({
  listIds: z.array(z.number()),
});

const CreateCampaignInputSchema = z.object({
  name: z.string(),
  subject: z.string(),
  sender: CampaignSenderSchema,
  htmlContent: z.string(),
  recipients: CampaignRecipientsSchema,
  scheduledAt: z.string().datetime().optional(),
});

const CreateCampaignOutputSchema = z.object({
  success: z.boolean(),
  campaignId: z.number().optional(),
});

export async function createEmailCampaign(
  input: z.infer<typeof CreateCampaignInputSchema>
): Promise<z.infer<typeof CreateCampaignOutputSchema>> {
  return createCampaignFlow(input);
}

const createCampaignFlow = ai.defineFlow(
  {
    name: 'createCampaignFlow',
    inputSchema: CreateCampaignInputSchema,
    outputSchema: CreateCampaignOutputSchema,
  },
  async (campaignDetails) => {
    try {
      const apiInstance = new Brevo.EmailCampaignsApi();
      apiInstance.setApiKey(
        Brevo.EmailCampaignsApiApiKeys.apiKey,
        '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'
      );

      const emailCampaign = new Brevo.CreateEmailCampaign();
      
      emailCampaign.name = campaignDetails.name;
      emailCampaign.subject = campaignDetails.subject;
      emailCampaign.sender = campaignDetails.sender;
      emailCampaign.htmlContent = campaignDetails.htmlContent;
      emailCampaign.recipients = campaignDetails.recipients;
      emailCampaign.type = "classic";

      if (campaignDetails.scheduledAt) {
          emailCampaign.scheduledAt = campaignDetails.scheduledAt;
      }

      const result = await apiInstance.createEmailCampaign(emailCampaign);
      
      const campaignId = (result.body as any)?.id;

      return { success: true, campaignId: campaignId };

    } catch (error: any) {
      console.error('Error creating email campaign via Brevo:', error.body || error.message);
      throw new Error('Failed to create email campaign.');
    }
  }
);
