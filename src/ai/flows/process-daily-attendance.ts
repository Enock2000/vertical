'use server';

/**
 * @fileOverview A flow to process daily attendance records automatically.
 * It handles auto clock-out for employees who forgot and marks absent employees.
 * This flow is intended to be run once a day by a scheduler.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, get, set, update, child } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Employee, PayrollConfig, AttendanceRecord } from '@/lib/data';
import { format, addHours, parseISO, differenceInHours } from 'date-fns';

const ProcessAttendanceOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processedRecords: z.number(),
  absentRecords: z.number(),
  autoClockedOutRecords: z.number(),
});

export async function processDailyAttendance(): Promise<z.infer<typeof ProcessAttendanceOutputSchema>> {
  return processDailyAttendanceFlow({});
}

const processDailyAttendanceFlow = ai.defineFlow(
  {
    name: 'processDailyAttendanceFlow',
    inputSchema: z.object({}),
    outputSchema: ProcessAttendanceOutputSchema,
  },
  async () => {
    try {
      const todayString = format(new Date(), 'yyyy-MM-dd');
      let processedCount = 0;
      let absentCount = 0;
      let autoClockOutCount = 0;

      // 1. Get payroll config for working hours
      const configRef = ref(db, 'payrollConfig');
      const configSnapshot = await get(configRef);
      const config: PayrollConfig = configSnapshot.val();
      const workingHours = config?.workingHours || 8; // Default to 8 hours

      // 2. Get all active employees
      const employeesRef = ref(db, 'employees');
      const employeesSnapshot = await get(employeesRef);
      const employees: { [key: string]: Employee } = employeesSnapshot.val();
      const activeEmployees = Object.values(employees).filter(e => e.status === 'Active');

      if (!activeEmployees.length) {
        return { success: true, message: "No active employees to process.", processedRecords: 0, absentRecords: 0, autoClockedOutRecords: 0 };
      }

      // 3. Get today's attendance records
      const attendanceRef = ref(db, `attendance/${todayString}`);
      const attendanceSnapshot = await get(attendanceRef);
      const attendanceRecords: { [key: string]: AttendanceRecord } = attendanceSnapshot.val() || {};

      // 4. Iterate through active employees and process
      for (const employee of activeEmployees) {
        const employeeId = employee.id;
        const existingRecord = attendanceRecords[employeeId];

        if (existingRecord) {
          // Employee clocked in today, check if they forgot to clock out
          if (!existingRecord.checkOutTime) {
            const checkInTime = parseISO(existingRecord.checkInTime);
            const hoursSinceClockIn = differenceInHours(new Date(), checkInTime);

            if (hoursSinceClockIn >= workingHours) {
              const autoClockOutTime = addHours(checkInTime, workingHours);
              await update(child(attendanceRef, employeeId), {
                checkOutTime: autoClockOutTime.toISOString(),
                status: 'Auto Clock-out',
              });
              autoClockOutCount++;
              processedCount++;
            }
          }
        } else {
          // Employee did not clock in today, mark as absent
          const absentRecord: AttendanceRecord = {
            id: employeeId,
            employeeId: employeeId,
            employeeName: employee.name,
            date: todayString,
            checkInTime: new Date().toISOString(), // Placeholder, actual time not relevant
            checkOutTime: null,
            status: 'Absent',
          };
          await set(child(attendanceRef, employeeId), absentRecord);
          absentCount++;
          processedCount++;
        }
      }
      
      return { 
        success: true, 
        message: 'Daily attendance processed successfully.',
        processedRecords: processedCount,
        absentRecords: absentCount,
        autoClockedOutRecords: autoClockOutCount
      };
    } catch (error: any) {
      console.error("Error processing daily attendance:", error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred.',
        processedRecords: 0,
        absentRecords: 0,
        autoClockedOutRecords: 0,
      };
    }
  }
);
