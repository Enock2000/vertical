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
  try {
    return await generateContractFlow(input);
  } catch (error) {
    console.error('Error in generateContract:', error);
    // Return a fallback contract template if AI fails
    return {
      contractText: generateFallbackContract(input),
    };
  }
}

// Fallback template if AI is unavailable
function generateFallbackContract(input: GenerateContractInput): string {
  return `
EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is entered into as of ${input.contractStartDate}.

BETWEEN:

${input.companyName} (hereinafter referred to as the "Employer")

AND

${input.employeeName} (hereinafter referred to as the "Employee")

1. POSITION
The Employee is hereby employed as ${input.jobTitle}.

2. COMMENCEMENT DATE
This employment shall commence on ${input.contractStartDate}.

3. CONTRACT TYPE
This is a ${input.contractType} employment contract.
${input.contractEndDate ? `The contract shall end on ${input.contractEndDate}.` : ''}

4. REMUNERATION
The Employee shall receive an annual gross salary of ZMW ${input.salary.toLocaleString()}, payable monthly.

5. PROBATION PERIOD
The Employee shall be on probation for the first three (3) months of employment.

6. DUTIES AND RESPONSIBILITIES
The Employee agrees to perform all duties and responsibilities assigned by the Employer.

7. CONFIDENTIALITY
The Employee agrees to maintain confidentiality regarding all company information.

8. TERMINATION
Either party may terminate this contract with one (1) month's written notice.

9. GOVERNING LAW
This contract shall be governed by the laws of the Republic of Zambia.

SIGNATURES:

_________________________                    Date: _______________
Employer Representative

_________________________                    Date: _______________
${input.employeeName}
`;
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
