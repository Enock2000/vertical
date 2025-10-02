// src/ai/flows/process-job-closures.ts
'use server';

/**
 * @fileOverview A scheduled flow to automatically close job vacancies after their closing date.
 * This should be run once daily.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { JobVacancy, Company } from '@/lib/data';
import { isPast } from 'date-fns';

const JobClosureOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  closedJobs: z.number(),
});

export async function processJobClosures(): Promise<z.infer<typeof JobClosureOutputSchema>> {
  return processJobClosuresFlow({});
}

const processJobClosuresFlow = ai.defineFlow(
  {
    name: 'processJobClosuresFlow',
    inputSchema: z.object({}),
    outputSchema: JobClosureOutputSchema,
  },
  async () => {
    try {
      let closedJobsCount = 0;
      const companiesRef = ref(db, 'companies');
      const companiesSnapshot = await get(companiesRef);
      const companiesData: Record<string, Company> = companiesSnapshot.val();

      if (!companiesData) {
        return { success: true, message: 'No companies found.', closedJobs: 0 };
      }

      for (const companyId in companiesData) {
        const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
        const jobsSnapshot = await get(jobsRef);
        const jobsData: Record<string, JobVacancy> = jobsSnapshot.val();
        
        if (jobsData) {
            for (const jobId in jobsData) {
                const job = jobsData[jobId];
                if (job.status === 'Open' && job.closingDate && isPast(new Date(job.closingDate))) {
                    const jobRef = ref(db, `companies/${companyId}/jobVacancies/${jobId}`);
                    await update(jobRef, { status: 'Closed' });
                    closedJobsCount++;
                }
            }
        }
      }

      return {
        success: true,
        message: `Successfully processed job closures. Closed ${closedJobsCount} jobs.`,
        closedJobs: closedJobsCount,
      };

    } catch (error: any) {
      console.error('Error processing job closures:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred.',
        closedJobs: 0,
      };
    }
  }
);
