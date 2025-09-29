
'use server';

/**
 * @fileOverview Handles job applications, including file uploads to Firebase Storage.
 * 
 * - handleApplication - A function that processes a new job application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Applicant } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';

const ApplicationInputSchema = z.object({
  companyId: z.string(),
  jobVacancyId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

const ApplicationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function handleApplication(
  formData: FormData
): Promise<z.infer<typeof ApplicationOutputSchema>> {
    const rawData = {
        companyId: formData.get('companyId'),
        jobVacancyId: formData.get('jobVacancyId'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
    };
    const resumeFile = formData.get('resume') as File | null;
    const vacancyTitle = formData.get('vacancyTitle') as string;

    if (!resumeFile) {
        return { success: false, message: 'Resume file is required.' };
    }

    const validatedFields = ApplicationInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }

    return handleApplicationFlow({ ...validatedFields.data, resumeFile, vacancyTitle });
}


const handleApplicationFlow = ai.defineFlow(
  {
    name: 'handleApplicationFlow',
    inputSchema: ApplicationInputSchema.extend({ resumeFile: z.any(), vacancyTitle: z.string() }),
    outputSchema: ApplicationOutputSchema,
  },
  async ({ companyId, jobVacancyId, name, email, phone, resumeFile, vacancyTitle }) => {
    try {
        // 1. Upload resume to Firebase Storage
        const fileRef = storageRef(storage, `resumes/${companyId}/${jobVacancyId}/${Date.now()}-${resumeFile.name}`);
        const snapshot = await uploadBytes(fileRef, resumeFile);
        const resumeUrl = await getDownloadURL(snapshot.ref);

        // 2. Create applicant record in Realtime Database
        const applicantsRef = dbRef(db, `companies/${companyId}/applicants`);
        const newApplicantRef = push(applicantsRef);
        const newApplicantId = newApplicantRef.key!;

        const newApplicant: Omit<Applicant, 'id' | 'companyId'> = {
            jobVacancyId,
            name,
            email,
            phone,
            resumeUrl,
            status: 'New',
            appliedAt: new Date().toISOString(),
        };

        await set(newApplicantRef, {
            ...newApplicant,
            id: newApplicantId
        });
        
        // 3. Notify admins
        const adminIds = await getAdminUserIds(companyId);
        for (const adminId of adminIds) {
            await createNotification(companyId, {
                userId: adminId,
                title: 'New Job Application',
                message: `${name} has applied for the ${vacancyTitle} position.`,
                link: `/dashboard/recruitment?vacancy=${jobVacancyId}`,
            });
        }

        return { success: true, message: 'Application submitted successfully!' };

    } catch (error: any) {
        console.error("Error handling application:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
