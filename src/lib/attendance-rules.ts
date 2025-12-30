// src/lib/attendance-rules.ts
// Attendance Rules Engine - handles late detection, overtime calculation, and status determination

import { differenceInMinutes, parseISO, format, isAfter, isBefore, addMinutes } from 'date-fns';
import type { AttendanceRecord, Shift, PayrollConfig } from './data';

export interface AttendanceRulesConfig {
    graceMinutes: number;           // Grace period for late (default: 15)
    halfDayThresholdHours: number;  // Hours for half-day (default: 4)
    autoAbsentAfterHours: number;   // Auto-mark absent after X hours past shift start (default: 4)
    maxBreakMinutes: number;        // Maximum break duration (default: 60)
    overtimeAfterMinutes: number;   // Overtime kicks in after X minutes over shift (default: 0)
    weekendDays: number[];          // Weekend days (default: [0, 6] - Sunday, Saturday)
}

export const DEFAULT_ATTENDANCE_RULES: AttendanceRulesConfig = {
    graceMinutes: 15,
    halfDayThresholdHours: 4,
    autoAbsentAfterHours: 4,
    maxBreakMinutes: 60,
    overtimeAfterMinutes: 0,
    weekendDays: [0, 6],
};

/**
 * Determine attendance status based on check-in time and shift
 */
export function determineAttendanceStatus(
    checkInTime: Date,
    shift: Shift | null,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): { status: AttendanceRecord['status']; lateMinutes: number } {
    if (!shift) {
        // No shift assigned, default to Present
        return { status: 'Present', lateMinutes: 0 };
    }

    // Parse shift start time (format: "HH:mm")
    const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
    const shiftStart = new Date(checkInTime);
    shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

    // Calculate late minutes
    const lateMinutes = differenceInMinutes(checkInTime, shiftStart);

    if (lateMinutes <= 0) {
        // On time or early
        return { status: 'Present', lateMinutes: 0 };
    } else if (lateMinutes <= rules.graceMinutes) {
        // Within grace period
        return { status: 'Present', lateMinutes: 0 };
    } else {
        // Late
        return { status: 'Late', lateMinutes };
    }
}

/**
 * Calculate overtime minutes based on check-out time and shift
 */
export function calculateOvertimeMinutes(
    checkInTime: Date,
    checkOutTime: Date,
    breakDuration: number = 0,
    shift: Shift | null,
    payrollConfig: PayrollConfig | null,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): number {
    // Calculate total work time
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime) - breakDuration;

    // Get expected work hours
    let expectedMinutes = (payrollConfig?.dailyTargetHours || 8) * 60;

    if (shift) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        expectedMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    }

    // Calculate overtime
    const overtimeMinutes = totalMinutes - expectedMinutes - rules.overtimeAfterMinutes;
    return Math.max(0, overtimeMinutes);
}

/**
 * Calculate total work minutes excluding breaks
 */
export function calculateWorkMinutes(
    checkInTime: string,
    checkOutTime: string | null,
    breakDuration: number = 0
): number {
    if (!checkOutTime) {
        // Still working, calculate from now
        return differenceInMinutes(new Date(), parseISO(checkInTime)) - breakDuration;
    }
    return differenceInMinutes(parseISO(checkOutTime), parseISO(checkInTime)) - breakDuration;
}

/**
 * Check if employee should be marked as absent
 */
export function shouldMarkAbsent(
    shift: Shift | null,
    currentTime: Date,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): boolean {
    if (!shift) return false;

    const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
    const shiftStart = new Date(currentTime);
    shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

    const cutoffTime = addMinutes(shiftStart, rules.autoAbsentAfterHours * 60);
    return isAfter(currentTime, cutoffTime);
}

/**
 * Calculate early leave minutes
 */
export function calculateEarlyLeaveMinutes(
    checkOutTime: Date,
    shift: Shift | null,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): number {
    if (!shift) return 0;

    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    const shiftEnd = new Date(checkOutTime);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    if (isBefore(checkOutTime, shiftEnd)) {
        return differenceInMinutes(shiftEnd, checkOutTime);
    }
    return 0;
}

/**
 * Format minutes as HH:MM string
 */
export function formatMinutesAsTime(minutes: number): string {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    return `${hours}h ${mins}m`;
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(
    date: Date,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): boolean {
    return rules.weekendDays.includes(date.getDay());
}

/**
 * Calculate break duration in minutes
 */
export function calculateBreakDuration(
    breakInTime: string | null | undefined,
    breakOutTime: string | null | undefined
): number {
    if (!breakInTime || !breakOutTime) return 0;
    return differenceInMinutes(parseISO(breakOutTime), parseISO(breakInTime));
}

/**
 * Validate break duration against rules
 */
export function validateBreakDuration(
    breakDuration: number,
    rules: AttendanceRulesConfig = DEFAULT_ATTENDANCE_RULES
): { isValid: boolean; message?: string } {
    if (breakDuration > rules.maxBreakMinutes) {
        return {
            isValid: false,
            message: `Break exceeded maximum allowed time of ${rules.maxBreakMinutes} minutes`
        };
    }
    return { isValid: true };
}

/**
 * Get attendance summary for a day
 */
export interface DailyAttendanceSummary {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    onBreak: number;
    onLeave: number;
    clockedOut: number;
    averageWorkHours: number;
    totalOvertimeHours: number;
}

export function calculateDailyAttendanceSummary(
    records: AttendanceRecord[],
    totalEmployees: number
): DailyAttendanceSummary {
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const onBreak = records.filter(r => r.status === 'On Break').length;
    const clockedOut = records.filter(r => r.checkOutTime !== null).length;
    const absent = totalEmployees - records.length;

    const totalWorkMinutes = records.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0);
    const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

    return {
        totalEmployees,
        present: present + late,
        late,
        absent,
        onBreak,
        onLeave: 0, // Calculated separately from leave records
        clockedOut,
        averageWorkHours: records.length > 0 ? (totalWorkMinutes / records.length) / 60 : 0,
        totalOvertimeHours: totalOvertimeMinutes / 60,
    };
}
