// src/ai/flows/generate-offer-letter.ts
'use server';

/**
 * @fileOverview Generates a professional job offer letter.
 *
 * - generateOfferLetter - A function that creates a personalized offer letter.
 * - GenerateOfferLetterInput - The input type for the function.
 * - GenerateOfferLetterOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateOfferLetterInputSchema = z.object({
  applicantName: z.string().describe("The full name of the applicant."),
  jobTitle: z.string().describe("The title of the job position being offered."),
  companyName: z.string().describe("The name of the company making the offer."),
  salary: z.number().describe("The proposed annual salary."),
  startDate: z.string().describe("The proposed start date for the position (e.g., 'July 15, 2024')."),
});

export type GenerateOfferLetterInput = z.infer<typeof GenerateOfferLetterInputSchema>;

const GenerateOfferLetterOutputSchema = z.object({
  offerLetterText: z.string().describe("The full text of the generated job offer letter."),
});

export type GenerateOfferLetterOutput = z.infer<typeof GenerateOfferLetterOutputSchema>;

export async function generateOfferLetter(
  input: GenerateOfferLetterInput
): Promise<GenerateOfferLetterOutput> {
  return generateOfferLetterFlow(input);
}

const generateOfferLetterPrompt = ai.definePrompt({
  name: 'generateOfferLetterPrompt',
  input: { schema: GenerateOfferLetterInputSchema },
  output: { schema: GenerateOfferLetterOutputSchema },
  prompt: `You are an HR professional tasked with writing a clear, professional, and welcoming job offer letter.

Generate a formal job offer letter based on the following details:
- Applicant Name: {{{applicantName}}}
- Job Title: {{{jobTitle}}}
- Company Name: {{{companyName}}}
- Annual Salary: {{{salary}}}
- Start Date: {{{startDate}}}

The letter should include:
1. A clear offer of employment for the specified job title.
2. The annual salary details.
3. The planned start date.
4. A welcoming closing statement.
5. A placeholder for the company's representative to sign.

Do not include any placeholders for benefits or other details not provided. Keep the tone professional and positive.`,
});

const generateOfferLetterFlow = ai.defineFlow(
  {
    name: 'generateOfferLetterFlow',
    inputSchema: GenerateOfferLetterInputSchema,
    outputSchema: GenerateOfferLetterOutputSchema,
  },
  async (input) => {
    const { output } = await generateOfferLetterPrompt(input);
    return output!;
  }
);
