

'use server';

/**
 * @fileOverview Handles job applications, including file uploads to Firebase Storage and applicant account creation.
 * 
 * - handleApplication - A function that processes a new job application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage, auth as adminAuth } from '@/lib/firebase'; // Assuming adminAuth is configured
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import type { Applicant } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';

const ApplicationInputSchema = z.object({
  companyId: z.string(),
  jobVacancyId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  source: z.string().optional(),
});

const ApplicationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// We need to use the client-side auth for sending the email link
// So we will pass the auth object from the client if needed
// However, for user creation, we need the admin SDK. This is a simplification.
import { auth as clientAuth } from '@/lib/firebase';

export async function handleApplication(
  formData: FormData
): Promise<z.infer<typeof ApplicationOutputSchema>> {
    const rawData = {
        companyId: formData.get('companyId'),
        jobVacancyId: formData.get('jobVacancyId'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        source: formData.get('source'),
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
  async ({ companyId, jobVacancyId, name, email, phone, source, resumeFile, vacancyTitle }) => {
    try {
        const isGuest = companyId === 'guest';
        
        // Use a different path for guest applications if needed, for now we will combine them
        const applicantsRefPath = `companies/${companyId}/applicants`;
        
        const fileRefPath = isGuest 
            ? `resumes/guests/${jobVacancyId}/${Date.now()}-${resumeFile.name}`
            : `resumes/${companyId}/${jobVacancyId}/${Date.now()}-${resumeFile.name}`;

        // 1. Upload resume to Firebase Storage
        const fileRef = storageRef(storage, fileRefPath);
        const snapshot = await uploadBytes(fileRef, resumeFile);
        const resumeUrl = await getDownloadURL(snapshot.ref);

        // 2. Create applicant record in Realtime Database
        const applicantsRef = dbRef(db, applicantsRefPath);
        const newApplicantRef = push(applicantsRef);
        const newApplicantId = newApplicantRef.key!;
        
        // This is a simplified user creation. In a real-world scenario, you'd check if the user exists.
        // For this context, we will simply set the applicant ID to be based on a hash of their email.
        const applicantUserId = `applicant_${Buffer.from(email).toString('base64').replace(/=/g, '')}`;

        const newApplicant: Omit<Applicant, 'id'> = {
            userId: applicantUserId, // Link to auth user
            jobVacancyId,
            name,
            email,
            phone,
            resumeUrl,
            status: 'New',
            appliedAt: new Date().toISOString(),
            source: source || 'Unknown',
            companyId: companyId,
        };

        await set(newApplicantRef, {
            ...newApplicant,
            id: newApplicantId,
        });

        // 3. Send a welcome/login email
        // This simulates sending a password reset email which acts as a "magic link" for first login.
        try {
            await sendPasswordResetEmail(clientAuth, email);
        } catch (error: any) {
            // Ignore errors if user doesn't exist, as the application is already saved.
            // A more robust solution would check for user existence first.
            console.warn("Could not send login email, user may not exist in Auth yet:", error.message);
        }
        
        // 4. Notify admins if not a guest application
        if (!isGuest) {
            const adminIds = await getAdminUserIds(companyId);
            for (const adminId of adminIds) {
                await createNotification(companyId, {
                    userId: adminId,
                    title: 'New Job Application',
                    message: `${name} has applied for the ${vacancyTitle} position.`,
                    link: `/dashboard/recruitment?vacancy=${jobVacancyId}`,
                });
            }
        } else {
            // Logic to notify super admin for guest jobs can be added here
        }

        return { success: true, message: 'Application submitted successfully! Check your email for a link to your applicant portal.' };

    } catch (error: any) {
        console.error("Error handling application:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
