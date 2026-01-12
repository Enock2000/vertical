
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
import type { Employee, AttendanceRecord, RosterAssignment, Branch } from '@/lib/data';
import { format, parseISO } from 'date-fns';

const AttendanceInputSchema = z.object({
  userId: z.string(),
  companyId: z.string(),
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
  async ({ userId, companyId, action }) => {
    try {
      // 1. Get request IP address from headers
      const headersList = await headers();
      const ip = (headersList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();

      const employeeRef = ref(db, 'employees/' + userId);
      const employeeSnapshot = await get(employeeRef);
      const employee: Employee = employeeSnapshot.val();

      if (!employee || employee.companyId !== companyId) {
        return { success: false, message: 'Employee not found.' };
      }

      // 2. Get allowed IP from the employee's assigned branch
      if (employee.branchId) {
        const branchRef = ref(db, `companies/${companyId}/branches/${employee.branchId}`);
        const branchSnapshot = await get(branchRef);
        const branch: Branch | null = branchSnapshot.val();
        const allowedIp = branch?.ipAddress;

        if (allowedIp && ip !== allowedIp) {
          return {
            success: false,
            message: `Access denied. You can only clock in/out from your assigned branch IP address. Your IP: ${ip}`,
          };
        }
      }

      const todayString = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const attendanceRef = ref(db, `companies/${companyId}/attendance/${todayString}/${userId}`);

      // Get today's roster assignment to check shift times
      const rosterRef = ref(db, `companies/${companyId}/rosters/${todayString}/${userId}`);
      const rosterSnapshot = await get(rosterRef);
      const rosterAssignment: RosterAssignment | null = rosterSnapshot.val();
      const shiftStartTime = rosterAssignment?.startTime ? rosterAssignment.startTime.split(':') : null;
      const shiftEndTime = rosterAssignment?.endTime ? rosterAssignment.endTime.split(':') : null;

      if (action === 'clockIn') {
        // 4. Check employee status before clocking in
        if (employee.status !== 'Active') {
          return {
            success: false,
            message: `Cannot clock in. Your current status is "${employee.status}". Please contact HR.`
          }
        }

        let status: AttendanceRecord['status'] = 'Present';
        if (shiftStartTime) {
          const shiftStartToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(shiftStartTime[0]), parseInt(shiftStartTime[1]));
          if (now > shiftStartToday) {
            status = 'Late';
          }
        }

        const record: Omit<AttendanceRecord, 'id'> = {
          employeeId: userId,
          employeeName: employee.name,
          date: todayString,
          checkInTime: now.toISOString(),
          checkOutTime: null,
          status: status,
        };
        await set(attendanceRef, record);
        return { success: true, message: `Clocked in successfully. Status: ${status}` };
      }

      if (action === 'clockOut') {
        const snapshot = await get(attendanceRef);
        if (!snapshot.exists()) {
          return { success: false, message: 'Cannot clock out. No clock-in record found for today.' };
        }

        let status = snapshot.val().status as AttendanceRecord['status'];
        if (status !== 'Late') { // Don't override 'Late' status
          status = 'Present'; // Default to present if not late
        }

        if (shiftEndTime) {
          const shiftEndToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(shiftEndTime[0]), parseInt(shiftEndTime[1]));
          if (now < shiftEndToday) {
            status = 'Early Out';
          }
        }

        await update(attendanceRef, { checkOutTime: now.toISOString(), status: status });
        return { success: true, message: `Clocked out successfully. Status: ${status}` };
      }

      return { success: false, message: 'Invalid action.' };

    } catch (error: any) {
      console.error("Attendance Flow Error:", error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
