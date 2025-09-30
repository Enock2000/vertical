
// src/ai/flows/submit-training-flow.ts
'use server';

/**
 * @fileOverview Handles the submission of an employee's training and updates their enrollment status.
 *
 * - submitTraining - A function that processes the training submission.
 * - SubmitTrainingInput - The input type for the function.
 * - SubmitTrainingOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, push, get, update } from 'firebase/database';
import type { TrainingSubmission, Enrollment } from '@/lib/data';

const SubmitTrainingInputSchema = z.object({
  companyId: z.string(),
  employeeId: z.string(),
  courseId: z.string(),
  answers: z.record(z.string()), // questionId: answer
});
export type SubmitTrainingInput = z.infer<typeof SubmitTrainingInputSchema>;

const SubmitTrainingOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitTrainingOutput = z.infer<typeof SubmitTrainingOutputSchema>;

export async function submitTraining(
  input: SubmitTrainingInput
): Promise<SubmitTrainingOutput> {
  return submitTrainingFlow(input);
}

const submitTrainingFlow = ai.defineFlow(
  {
    name: 'submitTrainingFlow',
    inputSchema: SubmitTrainingInputSchema,
    outputSchema: SubmitTrainingOutputSchema,
  },
  async ({ companyId, employeeId, courseId, answers }) => {
    try {
      // 1. Save the submission
      const submissionsRef = ref(db, `companies/${companyId}/trainingSubmissions`);
      const newSubmissionRef = push(submissionsRef);
      const submissionData: Omit<TrainingSubmission, 'id'> = {
        companyId,
        employeeId,
        courseId,
        submissionDate: new Date().toISOString(),
        answers,
      };
      await set(newSubmissionRef, { ...submissionData, id: newSubmissionRef.key });

      // 2. Find and update the enrollment status
      const enrollmentsRef = ref(db, `companies/${companyId}/enrollments`);
      const snapshot = await get(enrollmentsRef);

      if (snapshot.exists()) {
        const enrollments: Record<string, Enrollment> = snapshot.val();
        let enrollmentKey: string | null = null;
        
        // Find the specific enrollment for this employee and course
        for (const key in enrollments) {
          if (enrollments[key].employeeId === employeeId && enrollments[key].courseId === courseId) {
            enrollmentKey = key;
            break;
          }
        }
        
        if (enrollmentKey) {
            const enrollmentRef = ref(db, `companies/${companyId}/enrollments/${enrollmentKey}`);
            await update(enrollmentRef, { status: 'Completed' });
        } else {
             console.warn(`Enrollment record not found for employee ${employeeId} and course ${courseId}`);
        }
      }

      return {
        success: true,
        message: 'Your training submission has been recorded successfully.',
      };
    } catch (error: any) {
      console.error('Error submitting training:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while submitting your training.',
      };
    }
  }
);
