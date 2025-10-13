// src/ai/flows/add-manual-applicant-flow.ts
'use server';

/**
 * @fileOverview Handles manual addition of a job applicant by an admin.
 * 
 * - addManualApplicant - A server action that processes the manual creation of an applicant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref, push, set, query, orderByChild, equalTo, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Applicant, Employee } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';

const ManualApplicantInputSchema = z.object({
  companyId: z.string(),
  jobVacancyId: z.string(),
  vacancyTitle: z.string(),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
  source: z.string().optional(),
});

const ManualApplicantOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function addManualApplicant(
  formData: FormData
): Promise<z.infer<typeof ManualApplicantOutputSchema>> {
    
    const rawData: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
        if (key !== 'resume' && typeof value === 'string') {
            rawData[key] = value;
        }
    }
    
    const validatedFields = ManualApplicantInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }

    const resumeFile = formData.get('resume') as File | null;

    return addManualApplicantFlow({ 
        ...validatedFields.data, 
        resumeFile,
    });
}


const addManualApplicantFlow = ai.defineFlow(
  {
    name: 'addManualApplicantFlow',
    inputSchema: ManualApplicantInputSchema.extend({ 
        resumeFile: z.any().optional(), 
    }),
    outputSchema: ManualApplicantOutputSchema,
  },
  async ({ companyId, jobVacancyId, vacancyTitle, name, email, phone, source, resumeFile }) => {
    try {
        let resumeUrl: string | null = null;
        
        // 1. Upload Resume if provided
        if (resumeFile && resumeFile.size > 0) {
            const fileRefPath = `resumes/${companyId}/${jobVacancyId}/${Date.now()}-${resumeFile.name}`;
            const fileRef = storageRef(storage, fileRefPath);
            const snapshot = await uploadBytes(fileRef, resumeFile);
            resumeUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Check for existing applicants for this job with the same email
        const applicantsRef = ref(db, `companies/${companyId}/applicants`);
        const q = query(applicantsRef, orderByChild('email'), equalTo(email));
        const existingAppsSnapshot = await get(q);
        
        if (existingAppsSnapshot.exists()) {
            const existingApps = existingAppsSnapshot.val();
            const hasAlreadyApplied = Object.values(existingApps).some(
                (app: any) => app.jobVacancyId === jobVacancyId
            );
            if (hasAlreadyApplied) {
                return { success: false, message: 'An applicant with this email has already applied for this job.' };
            }
        }
        
        // 3. Create a new employee record for the manual applicant
        const employeesRef = ref(db, 'employees');
        const newEmployeeRef = push(employeesRef);
        const newEmployee: Partial<Employee> = {
            id: newEmployeeRef.key!,
            name: name,
            email: email,
            phone: phone || '',
            role: 'Applicant',
            status: 'Active',
            avatar: `https://avatar.vercel.sh/${email}.png`,
            joinDate: new Date().toISOString(),
            resumeUrl: resumeUrl,
        };
        await set(newEmployeeRef, newEmployee);


        // 4. Create a new applicant record
        const newApplicantRef = push(applicantsRef);
        const newApplicant: Omit<Applicant, 'id'> = {
            userId: newEmployeeRef.key!, // Use the new employee's ID
            jobVacancyId,
            name,
            email,
            phone: phone || '',
            resumeUrl,
            status: 'New', // All manually added applicants start as 'New'
            appliedAt: new Date().toISOString(),
            source: source || 'Manual Entry',
            companyId: companyId,
        };

        await set(newApplicantRef, {
            ...newApplicant,
            id: newApplicantRef.key,
        });
        
        // 5. Notify admins about the new applicant
        const adminIds = await getAdminUserIds(companyId);
        for (const adminId of adminIds) {
            await createNotification(companyId, {
                userId: adminId,
                title: 'Applicant Manually Added',
                message: `${name} has been manually added as an applicant for the ${vacancyTitle} position.`,
                link: `/dashboard/recruitment?vacancy=${jobVacancyId}`,
            });
        }


        return { success: true, message: 'Applicant added successfully.' };

    } catch (error: any) {
        console.error("Error manually adding applicant:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
