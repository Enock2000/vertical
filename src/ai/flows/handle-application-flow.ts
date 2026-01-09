

'use server';

/**
 * @fileOverview Handles job applications, including file uploads to Firebase Storage and applicant account creation.
 * 
 * - handleApplication - A function that processes a new job application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, auth, actionCodeSettings } from '@/lib/firebase';
import { ref, push, set, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { uploadToB2 } from '@/lib/backblaze';
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
    coverLetter: z.string().optional(),
    linkedinProfile: z.string().optional(),
    source: z.string().optional(),
    answers: z.record(z.string()).optional(),
});

const ApplicationOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

// The server action that receives FormData from the client.
export async function handleApplication(
    input: FormData
): Promise<z.infer<typeof ApplicationOutputSchema>> {

    const rawData: { [key: string]: any } = {};
    const answers: Record<string, string> = {};
    let resumeFile: File | null = null;

    // Correctly parse FormData into a plain object and separate files/answers
    for (const [key, value] of input.entries()) {
        if (key === 'resume' && value instanceof File && value.size > 0) {
            resumeFile = value;
        } else if (key.startsWith('answers.')) {
            const questionId = key.substring(8);
            if (typeof value === 'string') {
                answers[questionId] = value;
            }
        } else if (typeof value === 'string') {
            rawData[key] = value;
        }
    }

    // Add the parsed answers to the data object for validation
    if (Object.keys(answers).length > 0) {
        rawData.answers = answers;
    }

    // Validate the extracted text fields
    const validatedFields = ApplicationInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        console.error("Application validation failed:", validatedFields.error.flatten().fieldErrors);
        return { success: false, message: 'Invalid form data.' };
    }

    const loggedInUserId = (await auth.currentUser?.uid) || undefined;

    // Call the Genkit flow with a clean, structured object
    return handleApplicationFlow({
        ...validatedFields.data,
        resumeFile,
        vacancyTitle: rawData.vacancyTitle,
        loggedInUserId
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
    async ({ companyId, jobVacancyId, name, email, phone, coverLetter, linkedinProfile, source, resumeFile, vacancyTitle, loggedInUserId, answers }) => {
        try {
            let userId = loggedInUserId;
            let resumeUrl: string | null = null;
            let userResumeFile: File | null = resumeFile;

            // --- User Handling Logic ---
            if (userId) {
                // User is already logged in (Quick Apply)
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
                    // An account exists, link to it
                    const existingUserData = userSnapshot.val();
                    userId = Object.keys(existingUserData)[0];
                } else {
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
                    if (phone) {
                        newUser.phone = phone;
                    }
                    await set(ref(db, `employees/${userId}`), newUser);
                }
            }

            // --- Resume Handling ---
            if (userResumeFile && userResumeFile.size > 0 && !resumeUrl) {
                const filePath = `resumes/${companyId}/${jobVacancyId}/${Date.now()}-${userResumeFile.name}`;
                const result = await uploadToB2(userResumeFile, filePath);
                if (result.success && result.url) {
                    resumeUrl = result.url;
                }
            }

            // Update resume URL on employee profile if a new one was uploaded
            if (resumeUrl && userId) {
                await update(ref(db, `employees/${userId}`), { resumeUrl });
            }


            // --- Application Record Creation ---
            const applicantsRef = ref(db, `companies/${companyId}/applicants`);

            // Check for existing application
            const existingAppQuery = query(applicantsRef, orderByChild('userId'), equalTo(userId!));
            const existingAppSnapshot = await get(existingAppQuery);
            if (existingAppSnapshot.exists()) {
                const existingApps = existingAppSnapshot.val();
                const hasAlreadyApplied = Object.values(existingApps).some(
                    (app: any) => app.jobVacancyId === jobVacancyId
                );
                if (hasAlreadyApplied) {
                    return { success: false, message: 'You have already applied for this job.' };
                }
            }

            const newApplicantRef = push(applicantsRef);
            const newApplicant: Omit<Applicant, 'id'> = {
                userId: userId!,
                jobVacancyId,
                name,
                email,
                phone: phone || '',
                coverLetter: coverLetter || '',
                linkedinProfile: linkedinProfile || '',
                resumeUrl,
                status: 'New',
                appliedAt: new Date().toISOString(),
                source: source || 'Unknown',
                companyId: companyId,
                answers: answers || {},
            };

            await set(newApplicantRef, {
                ...newApplicant,
                id: newApplicantRef.key,
            });

            // --- Post-Application Actions ---
            if (!loggedInUserId) {
                // Send a welcome/login email only to guest applicants (new or existing)
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
