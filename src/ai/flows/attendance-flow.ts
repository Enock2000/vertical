// src/ai/flows/attendance-flow.ts
'use server';

/**
 * @fileOverview Handles secure, server-side attendance clock-in and clock-out.
 *
 * - recordAttendance - A function that records employee attendance after IP verification.
 * - AttendanceInput - The input type for the recordAttendance function.
 * - AttendanceOutput - The return type for the recordAttendance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { headers } from 'next/headers';
import { get, ref, set, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { PayrollConfig, Employee, AttendanceRecord } from '@/lib/data';
import { format } from 'date-fns';

const AttendanceInputSchema = z.object({
  userId: z.string(),
  action: z.enum(['clockIn', 'clockOut']),
});

export type AttendanceInput = z.infer<typeof AttendanceInputSchema>;

const AttendanceOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type AttendanceOutput = z.infer<typeof AttendanceOutputSchema>;

export async function recordAttendance(
  input: AttendanceInput
): Promise<AttendanceOutput> {
  return attendanceFlow(input);
}

const attendanceFlow = ai.defineFlow(
  {
    name: 'attendanceFlow',
    inputSchema: AttendanceInputSchema,
    outputSchema: AttendanceOutputSchema,
  },
  async ({ userId, action }) => {
    try {
      // 1. Get request IP address from headers
      const headersList = headers();
      const ip = (headersList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();

      // 2. Get allowed IP from settings
      const configRef = ref(db, 'payrollConfig');
      const configSnapshot = await get(configRef);
      const config: PayrollConfig | null = configSnapshot.val();
      const allowedIp = config?.allowedIpAddress;

      // 3. Validate IP if it's configured
      if (allowedIp && ip !== allowedIp) {
        return {
          success: false,
          message: `Access denied. You can only clock in/out from the allowed IP address. Your IP: ${ip}`,
        };
      }
      
      const todayString = format(new Date(), 'yyyy-MM-dd');
      const attendanceRef = ref(db, `attendance/${todayString}/${userId}`);
      const now = new Date().toISOString();

      if (action === 'clockIn') {
        const employeeRef = ref(db, 'employees/' + userId);
        const employeeSnapshot = await get(employeeRef);
        const employee: Employee = employeeSnapshot.val();

        if (!employee) {
             return { success: false, message: 'Employee not found.' };
        }

        const record: AttendanceRecord = {
            id: userId,
            employeeId: userId,
            employeeName: employee.name,
            date: todayString,
            checkInTime: now,
            checkOutTime: null,
            status: 'Present',
        };
        await set(attendanceRef, record);
        return { success: true, message: 'Clocked in successfully.' };
      } 
      
      if (action === 'clockOut') {
        await update(attendanceRef, { checkOutTime: now });
        return { success: true, message: 'Clocked out successfully.' };
      }

      return { success: false, message: 'Invalid action.' };

    } catch (error: any) {
      console.error("Attendance Flow Error:", error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
