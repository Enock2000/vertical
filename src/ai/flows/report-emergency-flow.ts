// src/ai/flows/report-emergency-flow.ts
'use server';

/**
 * @fileOverview Handles emergency reports from employees, creating audit logs and notifying admins.
 * 
 * - reportEmergency - A function that processes an emergency alert.
 * - EmergencyInput - The input type for the function.
 * - EmergencyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { createNotification, getAdminUserIds, type AuditLog } from '@/lib/data';

const EmergencyInputSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  companyId: z.string(),
});
export type EmergencyInput = z.infer<typeof EmergencyInputSchema>;

const EmergencyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type EmergencyOutput = z.infer<typeof EmergencyOutputSchema>;

export async function reportEmergency(input: EmergencyInput): Promise<EmergencyOutput> {
  return reportEmergencyFlow(input);
}

// Helper function to create an audit log
async function createAuditLog(companyId: string, log: Omit<AuditLog, 'id' | 'companyId'>) {
    const logRef = ref(db, `companies/${companyId}/auditLogs`);
    const newLogRef = push(logRef);
    await set(newLogRef, { ...log, id: newLogRef.key, companyId, ...log });
}


const reportEmergencyFlow = ai.defineFlow(
  {
    name: 'reportEmergencyFlow',
    inputSchema: EmergencyInputSchema,
    outputSchema: EmergencyOutputSchema,
  },
  async ({ employeeId, employeeName, companyId }) => {
    try {
        const timestamp = new Date().toISOString();

        // 1. Create a critical audit log entry
        await createAuditLog(companyId, {
            actor: employeeName,
            action: 'Emergency Alert Triggered',
            details: `An emergency alert was triggered by ${employeeName} (ID: ${employeeId}).`,
            timestamp,
        });

        // 2. Get all admin user IDs for the specific company
        const adminIds = await getAdminUserIds(companyId);
        if (adminIds.length === 0) {
            console.warn("Emergency reported, but no admin users found to notify for company:", companyId);
            // Still return success as the audit log was created.
            return { success: true, message: "Emergency logged. No admins available for notification." };
        }

        // 3. Send a notification to each admin in the company
        for (const adminId of adminIds) {
            await createNotification(companyId, {
                userId: adminId,
                title: '🚨 Emergency Alert 🚨',
                message: `${employeeName} has reported an emergency. Please contact them immediately.`,
                link: `/dashboard/employees`, // Link to employee list, admin can find the user
            });
        }

        return { success: true, message: 'Emergency alert has been sent to all HR administrators.' };

    } catch (error: any) {
        console.error("Error in reportEmergencyFlow:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
