
// src/ai/flows/submit-training-flow.ts
'use server';

/**
 * @fileOverview Handles the submission of an employee's training, scores it, and updates their enrollment status.
 *
 * - submitTraining - A function that processes the training submission.
 * - SubmitTrainingInput - The input type for the function.
 * - SubmitTrainingOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, push, get, update } from 'firebase/database';
import type { TrainingSubmission, Enrollment, TrainingCourse } from '@/lib/data';

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
  score: z.number().optional(),
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
      // 1. Fetch the course to get questions and correct answers
      const courseRef = ref(db, `companies/${companyId}/trainingCourses/${courseId}`);
      const courseSnapshot = await get(courseRef);
      if (!courseSnapshot.exists()) {
        return { success: false, message: 'Training course not found.' };
      }
      const course: TrainingCourse = courseSnapshot.val();

      // 2. Score the submission
      let correctAnswers = 0;
      const scorableQuestions = course.questions.filter(q => q.type === 'multiple-choice' && q.correctAnswer);
      
      scorableQuestions.forEach(question => {
        if (answers[question.id] && answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = scorableQuestions.length > 0
        ? Math.round((correctAnswers / scorableQuestions.length) * 100)
        : 100; // If no scorable questions, give 100%

      // 3. Save the submission with the score
      const submissionsRef = ref(db, `companies/${companyId}/trainingSubmissions`);
      const newSubmissionRef = push(submissionsRef);
      const submissionData: Omit<TrainingSubmission, 'id'> = {
        companyId,
        employeeId,
        courseId,
        submissionDate: new Date().toISOString(),
        answers,
        score,
      };
      await set(newSubmissionRef, { ...submissionData, id: newSubmissionRef.key });

      // 4. Find and update the enrollment status and score
      const enrollmentsRef = ref(db, `companies/${companyId}/enrollments`);
      const snapshot = await get(enrollmentsRef);

      if (snapshot.exists()) {
        const enrollments: Record<string, Enrollment> = snapshot.val();
        let enrollmentKey: string | null = null;
        
        for (const key in enrollments) {
          if (enrollments[key].employeeId === employeeId && enrollments[key].courseId === courseId) {
            enrollmentKey = key;
            break;
          }
        }
        
        if (enrollmentKey) {
            const enrollmentRef = ref(db, `companies/${companyId}/enrollments/${enrollmentKey}`);
            await update(enrollmentRef, { status: 'Completed', score });
        } else {
             console.warn(`Enrollment record not found for employee ${employeeId} and course ${courseId}`);
        }
      }

      return {
        success: true,
        message: 'Your training submission has been recorded successfully.',
        score: score
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
