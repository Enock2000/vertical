// src/ai/flows/compliance-recommendations.ts
'use server';

/**
 * @fileOverview Provides AI-driven recommendations for compliance and legal mandates.
 *
 * - getComplianceRecommendations - A function that generates compliance recommendations.
 * - ComplianceRecommendationsInput - The input type for the getComplianceRecommendations function.
 * - ComplianceRecommendationsOutput - The return type for the getComplianceRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComplianceRecommendationsInputSchema = z.object({
  employeeLocation: z
    .string()
    .describe('The geographical location of the employee (e.g., city, state, country).'),
  contractDetails: z
    .string()
    .describe('Details of the employment contract, including salary, allowances, and deductions.'),
});

export type ComplianceRecommendationsInput = z.infer<
  typeof ComplianceRecommendationsInputSchema
>;

const ComplianceRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'AI-driven recommendations for compliance and legal mandates based on the input data.'
    ),
});

export type ComplianceRecommendationsOutput = z.infer<
  typeof ComplianceRecommendationsOutputSchema
>;

export async function getComplianceRecommendations(
  input: ComplianceRecommendationsInput
): Promise<ComplianceRecommendationsOutput> {
  return complianceRecommendationsFlow(input);
}

const complianceRecommendationsPrompt = ai.definePrompt({
  name: 'complianceRecommendationsPrompt',
  input: {schema: ComplianceRecommendationsInputSchema},
  output: {schema: ComplianceRecommendationsOutputSchema},
  prompt: `You are an AI-powered legal compliance assistant. Based on the employee location and contract details provided, generate recommendations for compliance and legal mandates.

Employee Location: {{{employeeLocation}}}
Contract Details: {{{contractDetails}}}

Compliance Recommendations:`,
});

const complianceRecommendationsFlow = ai.defineFlow(
  {
    name: 'complianceRecommendationsFlow',
    inputSchema: ComplianceRecommendationsInputSchema,
    outputSchema: ComplianceRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await complianceRecommendationsPrompt(input);
    return output!;
  }
);
