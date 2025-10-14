// src/ai/flows/send-email-flow.ts
'use server';

/**
 * @fileOverview Handles sending transactional emails via Brevo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as Brevo from '@getbrevo/brevo';

const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const EmailParamsSchema = z.record(z.union([z.string(), z.number()]));

const SendEmailInputSchema = z.object({
  templateId: z.number(),
  to: EmailRecipientSchema,
  params: EmailParamsSchema,
});

const SendEmailOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
});

export async function sendEmail(
  input: z.infer<typeof SendEmailInputSchema>
): Promise<z.infer<typeof SendEmailOutputSchema>> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async ({ templateId, to, params }) => {
    try {
      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        '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'
      );

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.templateId = templateId;
      sendSmtpEmail.to = [to];
      sendSmtpEmail.params = params;
      sendSmtpEmail.sender = {
        email: 'no-reply@verticalsync.com',
        name: 'VerticalSync',
      };
      
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      
      // Brevo API returns a messageId on success
      const messageId = (result.body as any)?.messageId;

      return { success: true, messageId: messageId || 'unknown' };

    } catch (error: any) {
      console.error('Error sending email via Brevo:', error.body || error.message);
      // Re-throwing the error will cause the flow to fail, which is appropriate
      // if email sending is critical. If not, you could return { success: false }.
      throw new Error('Failed to send transactional email.');
    }
  }
);
