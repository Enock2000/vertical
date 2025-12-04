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

const EmailParamsSchema = z.record(z.union([z.string(), z.number()])).optional();

// Define two separate schemas for the two types of emails
const TemplateEmailSchema = z.object({
  to: z.array(EmailRecipientSchema),
  templateId: z.number(),
  params: EmailParamsSchema,
});

const DirectEmailSchema = z.object({
  to: z.array(EmailRecipientSchema),
  subject: z.string(),
  htmlContent: z.string(),
});

// Use a union of the two schemas
const SendEmailInputSchema = z.union([TemplateEmailSchema, DirectEmailSchema]);

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
  async (input) => {
    try {
      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY || ''
      );

      const sendSmtpEmail = new Brevo.SendSmtpEmail();

      sendSmtpEmail.to = input.to;

      // Check which type of email it is and set properties accordingly
      if ('templateId' in input) {
        sendSmtpEmail.templateId = input.templateId;
        if (input.params) {
          sendSmtpEmail.params = input.params;
        }
      } else {
        sendSmtpEmail.subject = input.subject;
        sendSmtpEmail.htmlContent = input.htmlContent;
      }

      sendSmtpEmail.sender = {
        email: 'no-reply@verticalsync.com',
        name: 'VerticalSync Platform',
      };

      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

      const messageId = (result.body as any)?.messageId;

      return { success: true, messageId: messageId || 'unknown' };

    } catch (error: any) {
      console.error('Error sending email via Brevo:', error.body || error.message);
      throw new Error('Failed to send transactional email.');
    }
  }
);
