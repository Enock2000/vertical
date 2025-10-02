
// src/ai/flows/request-leave-flow.ts
'use server';

/**
 * @fileOverview Handles leave requests, including optional sick note uploads.
 * 
 * - requestLeave - A server action that processes a new leave request.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { LeaveRequest } from '@/lib/data';
import { createNotification, getAdminUserIds } from '@/lib/data';

const LeaveRequestInputSchema = z.object({
  companyId: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  leaveType: z.enum(['Annual', 'Sick', 'Unpaid', 'Maternity']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
});

const LeaveRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function requestLeave(
  formData: FormData
): Promise<z.infer<typeof LeaveRequestOutputSchema>> {
    const rawData = {
        companyId: formData.get('companyId'),
        employeeId: formData.get('employeeId'),
        employeeName: formData.get('employeeName'),
        leaveType: formData.get('leaveType'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        reason: formData.get('reason'),
    };
    const sickNoteFile = formData.get('sickNote') as File | null;

    const validatedFields = LeaveRequestInputSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }
    
    if (validatedFields.data.leaveType === 'Sick' && !sickNoteFile?.name) {
        return { success: false, message: 'A sick note is required for sick leave.' };
    }

    return requestLeaveFlow({ ...validatedFields.data, sickNoteFile });
}


const requestLeaveFlow = ai.defineFlow(
  {
    name: 'requestLeaveFlow',
    inputSchema: LeaveRequestInputSchema.extend({ sickNoteFile: z.any().optional() }),
    outputSchema: LeaveRequestOutputSchema,
  },
  async ({ sickNoteFile, ...requestData }) => {
    try {
        const newLeaveRequest: Omit<LeaveRequest, 'id'> = {
            ...requestData,
            status: 'Pending',
        };

        // 1. If sick leave, upload the sick note and add the URL
        if (requestData.leaveType === 'Sick' && sickNoteFile && sickNoteFile.name) {
            const fileRef = storageRef(storage, `sick-notes/${requestData.companyId}/${requestData.employeeId}/${Date.now()}-${sickNoteFile.name}`);
            const snapshot = await uploadBytes(fileRef, sickNoteFile);
            newLeaveRequest.sickNoteUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Create leave request record in Realtime Database
        const leaveRequestsRef = dbRef(db, `companies/${requestData.companyId}/leaveRequests`);
        const newRequestRef = push(leaveRequestsRef);
        
        await set(newRequestRef, { ...newLeaveRequest, id: newRequestRef.key });
        
        // 3. Notify admins
        const adminIds = await getAdminUserIds(requestData.companyId);
        for (const adminId of adminIds) {
            await createNotification(requestData.companyId, {
                userId: adminId,
                title: 'New Leave Request',
                message: `${requestData.employeeName} has requested ${requestData.leaveType} leave.`,
                link: '/dashboard/leave',
            });
        }

        return { success: true, message: 'Leave request submitted successfully!' };

    } catch (error: any) {
        console.error("Error submitting leave request:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
