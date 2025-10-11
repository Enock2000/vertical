

'use server';

/**
 * @fileOverview Handles job applications, including file uploads to Firebase Storage and applicant account creation.
 * 
 * - handleApplication - A function that processes a new job application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage, auth, actionCodeSettings } from '@/lib/firebase';
import { ref, push, set, query, orderByChild, equalTo, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendSignInLinkToEmail } from 'firebase/auth';
import type { Applicant, Employee } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';
import { headers } from 'next/headers';

const ApplicationInputSchema = z.object({
  companyId: z.string(),
  jobVacancyId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
});

const ApplicationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function handleApplication(
  input: FormData | z.infer<typeof ApplicationInputSchema>
): Promise<z.infer<typeof ApplicationOutputSchema>> {

    let rawData: z.infer<typeof ApplicationInputSchema>;
    let resumeFile: File | null = null;
    let vacancyTitle: string = '';
    const authUser = auth.currentUser;


    if (input instanceof FormData) {
        rawData = {
            companyId: input.get('companyId') as string,
            jobVacancyId: input.get('jobVacancyId') as string,
            name: input.get('name') as string,
            email: input.get('email') as string,
            phone: input.get('phone') as string | undefined,
            source: input.get('source') as string | undefined,
        };
        resumeFile = input.get('resume') as File | null;
        vacancyTitle = input.get('vacancyTitle') as string;
    } else {
        rawData = input;
         // In a quick apply scenario, some data isn't in the initial object, so we fetch it.
        const jobSnap = await get(ref(db, `companies/${rawData.companyId}/jobVacancies/${rawData.jobVacancyId}`));
        if (jobSnap.exists()) {
            vacancyTitle = jobSnap.val().title;
        }
    }

    const validatedFields = ApplicationInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        console.error("Application validation failed:", validatedFields.error.flatten().fieldErrors);
        return { success: false, message: 'Invalid form data.' };
    }

    return handleApplicationFlow({ 
        ...validatedFields.data, 
        resumeFile, 
        vacancyTitle,
        loggedInUserId: authUser?.uid
    });
}


const handleApplicationFlow = ai.defineFlow(
  {
    name: 'handleApplicationFlow',
    inputSchema: ApplicationInputSchema.extend({ 
        resumeFile: z.any().optional(), 
        vacancyTitle: z.string(),
        loggedInUserId: z.string().optional(),
    }),
    outputSchema: ApplicationOutputSchema,
  },
  async ({ companyId, jobVacancyId, name, email, phone, source, resumeFile, vacancyTitle, loggedInUserId }) => {
    try {
        let userId = loggedInUserId;
        let resumeUrl: string | null = null;
        let userResumeFile: File | null = resumeFile;

        // --- User Handling Logic ---
        if (loggedInUserId) {
            // User is already logged in (Quick Apply)
            userId = loggedInUserId;
             // For logged-in user, check if they have a resume on file
            const employeeSnap = await get(ref(db, `employees/${userId}`));
            const employeeData: Employee | null = employeeSnap.val();
            if (employeeData?.resumeUrl && (!userResumeFile || userResumeFile.size === 0)) {
                resumeUrl = employeeData.resumeUrl;
            }
        } else {
            // This is a new, guest application
            const employeesRef = ref(db, 'employees');
            const q = query(employeesRef, orderByChild('email'), equalTo(email));
            const userSnapshot = await get(q);

            if (userSnapshot.exists()) {
                // An account exists, but the user is not logged in.
                return { success: false, message: 'An account with this email already exists. Please log in to apply.' };
            }

            // Create a new applicant account
            const newApplicantId = push(employeesRef).key!;
            userId = newApplicantId;
            const newUser: Partial<Employee> = {
                id: userId,
                name,
                email,
                role: 'Applicant',
                status: 'Active',
                joinDate: new Date().toISOString(),
                avatar: `https://avatar.vercel.sh/${email}.png`,
            };
            await set(ref(db, `employees/${userId}`), newUser);
        }
        
        // --- Resume Handling ---
        if (userResumeFile && userResumeFile.size > 0 && !resumeUrl) {
            const fileRefPath = `resumes/${companyId}/${jobVacancyId}/${Date.now()}-${userResumeFile.name}`;
            const fileRef = storageRef(storage, fileRefPath);
            const snapshot = await uploadBytes(fileRef, userResumeFile);
            resumeUrl = await getDownloadURL(snapshot.ref);
        }

        // Update resume URL on employee profile if a new one was uploaded
        if (resumeUrl && userId) {
            await update(ref(db, `employees/${userId}`), { resumeUrl });
        }


        // --- Application Record Creation ---
        const applicantsRef = ref(db, `companies/${companyId}/applicants`);
        const newApplicantRef = push(applicantsRef);
        
        const newApplicant: Omit<Applicant, 'id'> = {
            userId: userId!, 
            jobVacancyId,
            name,
            email,
            phone: phone || '',
            resumeUrl,
            status: 'New',
            appliedAt: new Date().toISOString(),
            source: source || 'Unknown',
            companyId: companyId,
        };

        await set(newApplicantRef, {
            ...newApplicant,
            id: newApplicantRef.key,
        });

        // --- Post-Application Actions ---
        if (!loggedInUserId) {
            // Send a welcome/login email only to new guest applicants
            try {
                const host = headers().get('host');
                const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
                const redirectUrl = `${protocol}://${host}/finish-login?email=${encodeURIComponent(email)}`;
                
                const customActionCodeSettings = { ...actionCodeSettings, url: redirectUrl };

                await sendSignInLinkToEmail(auth, email, customActionCodeSettings);
            } catch (error: any) {
                console.warn("Could not send login email:", error.message);
            }
        }
        
        // Notify admins about the new application (if not a guest job post)
        if (companyId !== 'guest') {
            const adminIds = await getAdminUserIds(companyId);
            for (const adminId of adminIds) {
                await createNotification(companyId, {
                    userId: adminId,
                    title: 'New Job Application',
                    message: `${name} has applied for the ${vacancyTitle} position.`,
                    link: `/dashboard/recruitment?vacancy=${jobVacancyId}`,
                });
            }
        }

        return { 
            success: true, 
            message: loggedInUserId 
                ? 'Application submitted successfully!' 
                : 'Application submitted! Check your email for a link to access your applicant portal.' 
        };

    } catch (error: any) {
        console.error("Error handling application:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
