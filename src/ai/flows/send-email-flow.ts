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
      // Check API key
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        console.error('BREVO_API_KEY environment variable is not set');
        return { success: false, messageId: 'missing-api-key' };
      }

      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey
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

      // Use environment variable for sender email (must be verified in Brevo)
      sendSmtpEmail.sender = {
        email: process.env.BREVO_SENDER_EMAIL || 'no-reply@verticalsync.oizm.app',
        name: process.env.BREVO_SENDER_NAME || 'VerticalSync Platform',
      };

      console.log('Sending email to:', input.to.map(t => t.email).join(', '));

      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

      const messageId = (result.body as any)?.messageId;
      console.log('Email sent successfully, messageId:', messageId);

      return { success: true, messageId: messageId || 'unknown' };

    } catch (error: any) {
      console.error('Error sending email via Brevo:', JSON.stringify(error.body || error.message, null, 2));
      // Return failure instead of throwing to prevent breaking the app
      return { success: false, messageId: error.body?.code || 'error' };
    }
  }
);
