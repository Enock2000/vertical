// src/lib/export-utils.ts
'use client';

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type {
    Employee,
    PayrollRun,
    LeaveRequest,
    Department,
    Role,
    AuditLog,
    AttendanceRecord,
    PayrollConfig
} from './data';

// Generic Excel export function
export function exportToExcel(
    data: any[],
    sheetName: string,
    filename: string
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const columnWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Generic CSV export function
export function exportToCsv(
    data: any[],
    filename: string
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Download as CSV
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
}

// ============= REPORT GENERATORS =============

// 1. Employee Roster Report
export function generateEmployeeRosterReport(employees: Employee[]) {
    return employees.map(emp => ({
        'Name': emp.name,
        'Email': emp.email,
        'Phone': emp.phone || 'N/A',
        'Department': emp.departmentName || 'N/A',
        'Branch': emp.branchName || 'N/A',
        'Role': emp.role || 'N/A',
        'Job Title': emp.jobTitle || emp.role || 'N/A',
        'Status': emp.status,
        'Worker Type': emp.workerType || 'Salaried',
        'Contract Type': emp.contractType || 'N/A',
        'Join Date': emp.joinDate ? format(new Date(emp.joinDate), 'yyyy-MM-dd') : 'N/A',
        'Salary (ZMW)': emp.salary || 0,
        'Allowances (ZMW)': emp.allowances || 0,
        'Bank Name': emp.bankName || 'N/A',
        'Account Number': emp.accountNumber || 'N/A',
        'Branch Code': emp.branchCode || 'N/A',
        'Annual Leave Balance': emp.annualLeaveBalance || 0,
    }));
}

// 2. Payroll History Report
export function generatePayrollHistoryReport(payrollRuns: PayrollRun[]) {
    return payrollRuns.map(run => {
        const employees = run.employees ? Object.values(run.employees) : [];
        const totalGross = employees.reduce((sum, e) => sum + (e.grossPay || 0), 0);
        const totalDeductions = employees.reduce((sum, e) => sum + (e.totalDeductions || 0), 0);
        const totalNet = employees.reduce((sum, e) => sum + (e.netPay || 0), 0);

        return {
            'Period': run.period || format(new Date(run.runDate), 'MMMM yyyy'),
            'Run Date': run.runDate ? format(new Date(run.runDate), 'yyyy-MM-dd HH:mm') : 'N/A',
            'Employees Paid': run.employeeCount || employees.length,
            'Total Gross Pay (ZMW)': totalGross.toFixed(2),
            'Total Deductions (ZMW)': totalDeductions.toFixed(2),
            'Total Net Pay (ZMW)': (run.totalAmount || totalNet).toFixed(2),
            'Processed By': run.runBy || 'System',
            'ACH File': run.achFileName || 'N/A',
        };
    });
}

// 3. Attendance Summary Report
export function generateAttendanceSummaryReport(
    employees: Employee[],
    allAttendance: Record<string, Record<string, AttendanceRecord>>,
    month?: Date
) {
    const targetMonth = month || new Date();
    const monthKey = format(targetMonth, 'yyyy-MM');

    return employees.filter(e => e.status === 'Active').map(emp => {
        let daysPresent = 0;
        let daysAbsent = 0;
        let daysLate = 0;
        let totalHours = 0;

        Object.keys(allAttendance).forEach(dateKey => {
            if (dateKey.startsWith(monthKey)) {
                const record = allAttendance[dateKey][emp.id];
                if (record) {
                    if (record.status === 'Present' || record.status === 'Auto Clock-out') {
                        daysPresent++;
                    } else if (record.status === 'Late') {
                        daysPresent++;
                        daysLate++;
                    } else if (record.status === 'Absent') {
                        daysAbsent++;
                    }
                    totalHours += record.hoursWorked || 0;
                }
            }
        });

        return {
            'Employee Name': emp.name,
            'Department': emp.departmentName || 'N/A',
            'Days Present': daysPresent,
            'Days Absent': daysAbsent,
            'Days Late': daysLate,
            'Total Hours Worked': totalHours.toFixed(2),
            'Average Hours/Day': daysPresent > 0 ? (totalHours / daysPresent).toFixed(2) : '0',
        };
    });
}

// 4. Daily Attendance Status Report
export function generateDailyAttendanceReport(
    employees: Employee[],
    attendanceRecords: Record<string, AttendanceRecord>,
    date: Date
) {
    return employees.filter(e => e.status === 'Active').map(emp => {
        const record = attendanceRecords[emp.id];
        return {
            'Employee Name': emp.name,
            'Email': emp.email,
            'Department': emp.departmentName || 'N/A',
            'Role': emp.role || 'N/A',
            'Date': format(date, 'yyyy-MM-dd'),
            'Status': record?.status || 'Not Recorded',
            'Check-In Time': record?.checkInTime || 'N/A',
            'Check-Out Time': record?.checkOutTime || 'N/A',
            'Hours Worked': record?.hoursWorked?.toFixed(2) || '0',
            'Overtime': record?.overtime?.toFixed(2) || '0',
        };
    });
}

// 5. Leave Report
export function generateLeaveReport(leaveRequests: LeaveRequest[], employees: Employee[]) {
    return leaveRequests.map(req => {
        const employee = employees.find(e => e.id === req.employeeId);
        const startDate = new Date(req.startDate);
        const endDate = new Date(req.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
            'Employee Name': employee?.name || req.employeeId,
            'Department': employee?.departmentName || 'N/A',
            'Leave Type': req.type,
            'Start Date': format(startDate, 'yyyy-MM-dd'),
            'End Date': format(endDate, 'yyyy-MM-dd'),
            'Days': days,
            'Status': req.status,
            'Reason': req.reason || 'N/A',
            'Requested On': req.requestedAt ? format(new Date(req.requestedAt), 'yyyy-MM-dd') : 'N/A',
        };
    });
}

// 6. Leave Balances Report
export function generateLeaveBalancesReport(employees: Employee[], leaveRequests: LeaveRequest[]) {
    return employees.filter(e => e.status === 'Active').map(emp => {
        const approvedLeave = leaveRequests.filter(
            r => r.employeeId === emp.id && r.status === 'Approved'
        );

        const annualLeaveTaken = approvedLeave
            .filter(r => r.type === 'Annual')
            .reduce((sum, r) => {
                const days = Math.ceil(
                    (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)
                ) + 1;
                return sum + days;
            }, 0);

        const sickLeaveTaken = approvedLeave
            .filter(r => r.type === 'Sick')
            .reduce((sum, r) => {
                const days = Math.ceil(
                    (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)
                ) + 1;
                return sum + days;
            }, 0);

        return {
            'Employee Name': emp.name,
            'Department': emp.departmentName || 'N/A',
            'Annual Leave Balance': emp.annualLeaveBalance || 0,
            'Annual Leave Taken': annualLeaveTaken,
            'Sick Leave Taken': sickLeaveTaken,
            'Total Leave Taken': annualLeaveTaken + sickLeaveTaken,
        };
    });
}

// 7. Department Report
export function generateDepartmentReport(
    departments: Department[],
    employees: Employee[],
    payrollConfig?: PayrollConfig | null
) {
    return departments.map(dept => {
        const deptEmployees = employees.filter(e =>
            e.departmentId === dept.id && e.status === 'Active'
        );
        const totalSalary = deptEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

        return {
            'Department Name': dept.name,
            'Manager': dept.managerId || 'Not Assigned',
            'Employee Count': deptEmployees.length,
            'Total Monthly Salary (ZMW)': totalSalary.toFixed(2),
            'Average Salary (ZMW)': deptEmployees.length > 0
                ? (totalSalary / deptEmployees.length).toFixed(2)
                : '0',
        };
    });
}

// 8. Roles Report
export function generateRolesReport(roles: Role[], employees: Employee[]) {
    return roles.map(role => {
        const rolesEmployees = employees.filter(e =>
            e.role === role.name || e.jobTitle === role.name
        );

        return {
            'Role Name': role.name,
            'Department': role.departmentName || 'N/A',
            'Permission Count': role.permissions?.length || 0,
            'Employees in Role': rolesEmployees.length,
            'Description': role.description || 'N/A',
        };
    });
}

// 9. Emergency Alerts / Audit Log Report
export function generateAuditLogReport(auditLogs: AuditLog[]) {
    return auditLogs.map(log => ({
        'Timestamp': log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Actor': log.actor,
        'Action': log.action,
        'Details': log.details || 'N/A',
    }));
}

// ============= EXPORT HANDLERS =============

export function downloadEmployeeRoster(employees: Employee[]) {
    const data = generateEmployeeRosterReport(employees);
    exportToExcel(data, 'Employee Roster', `Employee_Roster_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadPayrollHistory(payrollRuns: PayrollRun[]) {
    const data = generatePayrollHistoryReport(payrollRuns);
    exportToExcel(data, 'Payroll History', `Payroll_History_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadAttendanceSummary(
    employees: Employee[],
    allAttendance: Record<string, Record<string, AttendanceRecord>>
) {
    const data = generateAttendanceSummaryReport(employees, allAttendance);
    exportToExcel(data, 'Attendance Summary', `Attendance_Summary_${format(new Date(), 'yyyy-MM')}`);
}

export function downloadDailyAttendance(
    employees: Employee[],
    attendanceRecords: Record<string, AttendanceRecord>,
    date: Date
) {
    const data = generateDailyAttendanceReport(employees, attendanceRecords, date);
    exportToExcel(data, 'Daily Attendance', `Daily_Attendance_${format(date, 'yyyy-MM-dd')}`);
}

export function downloadLeaveReport(leaveRequests: LeaveRequest[], employees: Employee[]) {
    const data = generateLeaveReport(leaveRequests, employees);
    exportToExcel(data, 'Leave Report', `Leave_Report_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadLeaveBalances(employees: Employee[], leaveRequests: LeaveRequest[]) {
    const data = generateLeaveBalancesReport(employees, leaveRequests);
    exportToExcel(data, 'Leave Balances', `Leave_Balances_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadDepartmentReport(
    departments: Department[],
    employees: Employee[],
    payrollConfig?: PayrollConfig | null
) {
    const data = generateDepartmentReport(departments, employees, payrollConfig);
    exportToExcel(data, 'Departments', `Department_Report_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadRolesReport(roles: Role[], employees: Employee[]) {
    const data = generateRolesReport(roles, employees);
    exportToExcel(data, 'Roles', `Roles_Report_${format(new Date(), 'yyyy-MM-dd')}`);
}

export function downloadAuditLog(auditLogs: AuditLog[]) {
    const data = generateAuditLogReport(auditLogs);
    exportToExcel(data, 'Audit Log', `Audit_Log_${format(new Date(), 'yyyy-MM-dd')}`);
}
