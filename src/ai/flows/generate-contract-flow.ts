// src/ai/flows/generate-contract-flow.ts
'use server';

/**
 * @fileOverview Generates a professional employment contract.
 *
 * - generateContract - A function that creates a personalized employment contract.
 * - GenerateContractInput - The input type for the function.
 * - GenerateContractOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContractInputSchema = z.object({
  employeeName: z.string().describe("The full name of the employee."),
  jobTitle: z.string().describe("The official job title for the position."),
  companyName: z.string().describe("The legal name of the company."),
  salary: z.number().describe("The annual gross salary."),
  contractType: z.enum(['Permanent', 'Fixed-Term', 'Internship']).describe("The type of employment contract."),
  contractStartDate: z.string().describe("The start date of the employment (e.g., 'August 1, 2024')."),
  contractEndDate: z.string().optional().describe("The end date of the employment, if applicable (for Fixed-Term or Internship)."),
});

export type GenerateContractInput = z.infer<typeof GenerateContractInputSchema>;

const GenerateContractOutputSchema = z.object({
  contractText: z.string().describe("The full text of the generated employment contract."),
});

export type GenerateContractOutput = z.infer<typeof GenerateContractOutputSchema>;

export async function generateContract(
  input: GenerateContractInput
): Promise<GenerateContractOutput> {
  return generateContractFlow(input);
}

const generateContractPrompt = ai.definePrompt({
  name: 'generateContractPrompt',
  input: { schema: GenerateContractInputSchema },
  output: { schema: GenerateContractOutputSchema },
  prompt: `You are an expert legal assistant specializing in Zambian labor law. Your task is to generate a comprehensive and professional employment contract based on the details provided.

The contract should be formal and legally sound, suitable for official use in Zambia. It must include the following sections:
1.  **Parties**: Clearly state the Employer ({{{companyName}}}) and the Employee ({{{employeeName}}}).
2.  **Position**: State the job title ({{{jobTitle}}}).
3.  **Commencement Date**: Specify the start date ({{{contractStartDate}}}).
4.  **Contract Type**: Based on the type '{{{contractType}}}', correctly state the nature of the employment. If it is 'Fixed-Term' or 'Internship', you must also include the specified end date ({{{contractEndDate}}}).
5.  **Remuneration**: Detail the gross annual salary ({{{salary}}}).
6.  **Probation Period**: Include a standard probation period clause (e.g., three months).
7.  **Duties and Responsibilities**: A general clause stating the employee will perform duties assigned to them.
8.  **Confidentiality**: A standard clause regarding non-disclosure of company information.
9.  **Termination**: A clause explaining the conditions and notice period for termination.
10. **Governing Law**: State that the contract is governed by the laws of Zambia.
11. **Signatures**: Placeholder lines for both the Employer and Employee signatures.

Generate only the contract text.

**Contract Details:**
- Employee Name: {{{employeeName}}}
- Job Title: {{{jobTitle}}}
- Company Name: {{{companyName}}}
- Contract Type: {{{contractType}}}
- Start Date: {{{contractStartDate}}}
{{#if contractEndDate}}
- End Date: {{{contractEndDate}}}
{{/if}}
- Annual Salary: {{{salary}}}
`,
});

const generateContractFlow = ai.defineFlow(
  {
    name: 'generateContractFlow',
    inputSchema: GenerateContractInputSchema,
    outputSchema: GenerateContractOutputSchema,
  },
  async (input) => {
    const { output } = await generateContractPrompt(input);
    return output!;
  }
);
