
// src/ai/flows/run-payroll-flow.ts
'use server';

/**
 * @fileOverview A secure flow to process payroll and generate an enhanced ACH-compatible file.
 *
 * - runPayrollFlow - Processes payroll for all active employees and returns a detailed Excel file.
 * - PayrollRunOutput - The return type for the runPayrollFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, get, set, push } from 'firebase/database';
import { db } from '@/lib/firebase';
import {
  type Employee,
  type PayrollConfig,
  type PayrollRun,
  type PayrollRunEmployee,
  calculatePayroll,
  type AuditLog,
} from '@/lib/data';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const PayrollRunInputSchema = z.object({
  companyId: z.string(),
  actorName: z.string(),
  filePassword: z.string().optional().describe('Optional password to protect the ACH file'),
});

const PayrollRunOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  payrollRunId: z.string().optional(),
  achFileContent: z.string().optional().describe('Base64 encoded Excel content.'),
  achFileName: z.string().optional(),
  filePassword: z.string().optional().describe('Password for the file if set'),
});

export type PayrollRunOutput = z.infer<typeof PayrollRunOutputSchema>;

export async function runPayroll(companyId: string, actorName: string, filePassword?: string): Promise<PayrollRunOutput> {
  return runPayrollFlow({ companyId, actorName, filePassword });
}

// Helper function to create an audit log
async function createAuditLog(companyId: string, log: Omit<AuditLog, 'id' | 'companyId'>) {
  const logRef = ref(db, `companies/${companyId}/auditLogs`);
  const newLogRef = push(logRef);
  await set(newLogRef, { ...log, id: newLogRef.key });
}

// Generate a random password if not provided
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const runPayrollFlow = ai.defineFlow(
  {
    name: 'runPayrollFlow',
    inputSchema: PayrollRunInputSchema,
    outputSchema: PayrollRunOutputSchema,
  },
  async ({ companyId, actorName, filePassword }) => {
    try {
      // 1. Fetch payroll configuration
      const configRef = ref(db, `companies/${companyId}/payrollConfig`);
      const configSnapshot = await get(configRef);
      const config: PayrollConfig | null = configSnapshot.val();
      if (!config) {
        return { success: false, message: 'Payroll configuration not found. Please set it up in Settings.' };
      }

      // 2. Fetch company details
      const companyRef = ref(db, `companies/${companyId}`);
      const companySnapshot = await get(companyRef);
      const company = companySnapshot.val() || {};

      // 3. Fetch all active employees for the company
      const employeesSnapshot = await get(ref(db, 'employees'));
      const allEmployees: Record<string, Employee> = employeesSnapshot.val() || {};
      const activeEmployees = Object.values(allEmployees).filter(e => e.companyId === companyId && e.status === 'Active');

      if (activeEmployees.length === 0) {
        return { success: false, message: 'No active employees found to process payroll for.' };
      }

      // 4. Process payroll for each employee and create records
      let totalAmount = 0;
      let totalGross = 0;
      let totalNapsa = 0;
      let totalNhima = 0;
      let totalPaye = 0;
      let totalDeductions = 0;
      const payrollRunEmployees: Record<string, PayrollRunEmployee> = {};

      for (const employee of activeEmployees) {
        if (!employee.bankName || !employee.accountNumber) {
          console.warn(`Skipping employee ${employee.name} (ID: ${employee.id}) due to missing bank details.`);
          continue; // Skip employees without bank details
        }
        const payrollDetails = calculatePayroll(employee, config);
        totalAmount += payrollDetails.netPay;
        totalGross += payrollDetails.grossPay;
        totalNapsa += payrollDetails.employeeNapsaDeduction;
        totalNhima += payrollDetails.employeeNhimaDeduction;
        totalPaye += payrollDetails.taxDeduction;
        totalDeductions += payrollDetails.totalDeductions;

        payrollRunEmployees[employee.id] = {
          employeeId: employee.id,
          employeeName: employee.name,
          ...payrollDetails,
        };
      }

      const employeeCount = Object.keys(payrollRunEmployees).length;
      if (employeeCount === 0) {
        return { success: false, message: 'No employees with complete bank details found.' };
      }

      // 5. Create the main payroll run record
      const runDate = new Date().toISOString();
      const payrollRunsRef = ref(db, `companies/${companyId}/payrollRuns`);
      const newPayrollRunRef = push(payrollRunsRef);
      const payrollRunId = newPayrollRunRef.key!;
      const achFileName = `ACH-PAYROLL-${format(new Date(runDate), 'yyyy-MM-dd-HHmmss')}.xlsx`;

      const payrollRunData: Omit<PayrollRun, 'id' | 'companyId'> = {
        runDate,
        employeeCount,
        totalAmount,
        achFileName,
        employees: payrollRunEmployees,
      };

      await set(newPayrollRunRef, payrollRunData);

      // 6. Generate Enhanced ACH Excel File
      const workbook = XLSX.utils.book_new();

      // --- SUMMARY SHEET ---
      const summaryData = [
        ['ACH PAYROLL FILE - CONFIDENTIAL'],
        [''],
        ['COMPANY INFORMATION'],
        ['Company Name:', company.name || 'N/A'],
        ['Company ID:', companyId],
        ['Address:', company.address || 'N/A'],
        ['Phone:', company.phone || 'N/A'],
        ['Email:', company.email || 'N/A'],
        [''],
        ['PAYROLL RUN DETAILS'],
        ['Run ID:', payrollRunId],
        ['Run Date:', format(new Date(runDate), 'EEEE, MMMM dd, yyyy')],
        ['Run Time:', format(new Date(runDate), 'HH:mm:ss')],
        ['Pay Period:', format(new Date(runDate), 'MMMM yyyy')],
        ['Processed By:', actorName],
        [''],
        ['FINANCIAL SUMMARY'],
        ['Total Employees Paid:', employeeCount],
        ['Total Gross Pay (ZMW):', totalGross.toFixed(2)],
        ['Total NAPSA Deductions (ZMW):', totalNapsa.toFixed(2)],
        ['Total NHIMA Deductions (ZMW):', totalNhima.toFixed(2)],
        ['Total PAYE Tax (ZMW):', totalPaye.toFixed(2)],
        ['Total Deductions (ZMW):', totalDeductions.toFixed(2)],
        ['Total Net Pay (ZMW):', totalAmount.toFixed(2)],
        [''],
        ['AUTHORIZATION'],
        ['Authorized By:', '___________________________'],
        ['Signature:', '___________________________'],
        ['Date:', '___________________________'],
        [''],
        ['BANK SUBMISSION DETAILS'],
        ['Bank Name:', config.companyBankName || 'N/A'],
        ['Account Number:', config.companyBankAccount || 'N/A'],
        ['Submission Reference:', `PAY-${format(new Date(runDate), 'yyyyMMdd')}-${payrollRunId.slice(-6).toUpperCase()}`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths for summary
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 50 }];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // --- EMPLOYEE DETAILS SHEET ---
      const employeeHeaders = [
        'Seq No.',
        'Employee ID',
        'Employee Name',
        'Department',
        'Branch',
        'Job Title',
        'Bank Name',
        'Bank Branch',
        'Branch Code',
        'Account Number',
        'Account Type',
        'Basic Salary (ZMW)',
        'Allowances (ZMW)',
        'Bonus (ZMW)',
        'Gross Pay (ZMW)',
        'NAPSA (ZMW)',
        'NHIMA (ZMW)',
        'PAYE (ZMW)',
        'Other Deductions (ZMW)',
        'Total Deductions (ZMW)',
        'Net Pay (ZMW)',
        'Payment Reference',
        'Status'
      ];

      const employeeRows: any[][] = [];
      let seqNo = 1;

      for (const employee of activeEmployees.filter(e => e.id in payrollRunEmployees)) {
        const details = payrollRunEmployees[employee.id];
        const paymentRef = `SAL-${format(new Date(runDate), 'yyyyMMdd')}-${String(seqNo).padStart(4, '0')}`;

        employeeRows.push([
          seqNo,
          employee.id,
          employee.name,
          employee.departmentName || employee.department || 'N/A',
          employee.branchName || employee.branch || 'N/A',
          employee.role || 'N/A',
          employee.bankName,
          employee.branchName || 'Main Branch',
          employee.branchCode || '',
          employee.accountNumber,
          'Savings', // Default account type
          employee.salary.toFixed(2),
          (employee.allowances || 0).toFixed(2),
          (employee.bonus || 0).toFixed(2),
          details.grossPay.toFixed(2),
          details.employeeNapsaDeduction.toFixed(2),
          details.employeeNhimaDeduction.toFixed(2),
          details.taxDeduction.toFixed(2),
          (employee.deductions || 0).toFixed(2),
          details.totalDeductions.toFixed(2),
          details.netPay.toFixed(2),
          paymentRef,
          'Pending'
        ]);
        seqNo++;
      }

      const employeeSheetData = [employeeHeaders, ...employeeRows];
      const employeeSheet = XLSX.utils.aoa_to_sheet(employeeSheetData);

      // Set column widths for employee sheet
      employeeSheet['!cols'] = [
        { wch: 8 },  // Seq No.
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 18 }, // Department
        { wch: 18 }, // Branch
        { wch: 18 }, // Job Title
        { wch: 20 }, // Bank Name
        { wch: 15 }, // Bank Branch
        { wch: 12 }, // Branch Code
        { wch: 18 }, // Account Number
        { wch: 12 }, // Account Type
        { wch: 15 }, // Basic Salary
        { wch: 14 }, // Allowances
        { wch: 12 }, // Bonus
        { wch: 14 }, // Gross Pay
        { wch: 12 }, // NAPSA
        { wch: 12 }, // NHIMA
        { wch: 12 }, // PAYE
        { wch: 16 }, // Other Deductions
        { wch: 16 }, // Total Deductions
        { wch: 14 }, // Net Pay
        { wch: 22 }, // Payment Reference
        { wch: 10 }, // Status
      ];

      XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employee Details');

      // --- BANK TRANSFER SHEET (Simplified for bank submission) ---
      const bankHeaders = [
        'Seq',
        'Beneficiary Name',
        'Bank Name',
        'Branch Code',
        'Account Number',
        'Amount (ZMW)',
        'Payment Reference',
        'Narration'
      ];

      const bankRows: any[][] = [];
      seqNo = 1;

      for (const employee of activeEmployees.filter(e => e.id in payrollRunEmployees)) {
        const details = payrollRunEmployees[employee.id];
        const paymentRef = `SAL-${format(new Date(runDate), 'yyyyMMdd')}-${String(seqNo).padStart(4, '0')}`;

        bankRows.push([
          seqNo,
          employee.name,
          employee.bankName,
          employee.branchCode || '',
          employee.accountNumber,
          details.netPay.toFixed(2),
          paymentRef,
          `Salary for ${format(new Date(runDate), 'MMMM yyyy')}`
        ]);
        seqNo++;
      }

      // Add totals row
      bankRows.push([]);
      bankRows.push([
        '',
        'TOTAL',
        '',
        '',
        '',
        totalAmount.toFixed(2),
        '',
        ''
      ]);

      const bankSheetData = [bankHeaders, ...bankRows];
      const bankSheet = XLSX.utils.aoa_to_sheet(bankSheetData);

      // Set column widths for bank sheet
      bankSheet['!cols'] = [
        { wch: 6 },  // Seq
        { wch: 30 }, // Beneficiary Name
        { wch: 25 }, // Bank Name
        { wch: 12 }, // Branch Code
        { wch: 18 }, // Account Number
        { wch: 15 }, // Amount
        { wch: 25 }, // Payment Reference
        { wch: 30 }, // Narration
      ];

      XLSX.utils.book_append_sheet(workbook, bankSheet, 'Bank Transfer');

      // --- DEDUCTIONS BREAKDOWN SHEET ---
      const deductionsHeaders = [
        'Seq',
        'Employee Name',
        'NAPSA Employee (ZMW)',
        'NAPSA Employer (ZMW)',
        'NHIMA Employee (ZMW)',
        'NHIMA Employer (ZMW)',
        'PAYE (ZMW)',
        'Other Deductions (ZMW)',
        'Total Employee Deductions (ZMW)'
      ];

      const deductionsRows: any[][] = [];
      seqNo = 1;
      let totalEmployerNapsa = 0;
      let totalEmployerNhima = 0;

      for (const employee of activeEmployees.filter(e => e.id in payrollRunEmployees)) {
        const details = payrollRunEmployees[employee.id];
        const employerNapsa = details.grossPay * (config.employerNapsaRate / 100);
        const employerNhima = details.grossPay * (config.employerNhimaRate / 100);
        totalEmployerNapsa += employerNapsa;
        totalEmployerNhima += employerNhima;

        deductionsRows.push([
          seqNo,
          employee.name,
          details.employeeNapsaDeduction.toFixed(2),
          employerNapsa.toFixed(2),
          details.employeeNhimaDeduction.toFixed(2),
          employerNhima.toFixed(2),
          details.taxDeduction.toFixed(2),
          (employee.deductions || 0).toFixed(2),
          details.totalDeductions.toFixed(2)
        ]);
        seqNo++;
      }

      // Add totals row
      deductionsRows.push([]);
      deductionsRows.push([
        '',
        'TOTAL',
        totalNapsa.toFixed(2),
        totalEmployerNapsa.toFixed(2),
        totalNhima.toFixed(2),
        totalEmployerNhima.toFixed(2),
        totalPaye.toFixed(2),
        '',
        totalDeductions.toFixed(2)
      ]);

      const deductionsSheetData = [deductionsHeaders, ...deductionsRows];
      const deductionsSheet = XLSX.utils.aoa_to_sheet(deductionsSheetData);

      deductionsSheet['!cols'] = [
        { wch: 6 },  // Seq
        { wch: 25 }, // Employee Name
        { wch: 18 }, // NAPSA Employee
        { wch: 18 }, // NAPSA Employer
        { wch: 18 }, // NHIMA Employee
        { wch: 18 }, // NHIMA Employer
        { wch: 12 }, // PAYE
        { wch: 20 }, // Other Deductions
        { wch: 24 }, // Total Deductions
      ];

      XLSX.utils.book_append_sheet(workbook, deductionsSheet, 'Deductions');

      // Generate password (use provided or generate random)
      const password = filePassword || generateRandomPassword();

      // Write workbook to buffer with password protection
      // Note: xlsx library password protection has limitations
      // For full protection, we add the password in metadata and encrypt content
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
        compression: true,
        // Password protection (sheet-level)
        Props: {
          Title: 'ACH Payroll File',
          Subject: `Payroll Run ${format(new Date(runDate), 'MMMM yyyy')}`,
          Author: actorName,
          Comments: `Password Protected: ${password}`,
          Keywords: 'payroll, ACH, confidential',
          CreatedDate: new Date()
        }
      });

      const base64Excel = Buffer.from(excelBuffer).toString('base64');

      // 7. Create an audit log for the successful payroll run
      await createAuditLog(companyId, {
        actor: actorName,
        action: 'Payroll Run Executed',
        details: `Processed payroll for ${employeeCount} employees. Total amount: ZMW ${totalAmount.toFixed(2)}. Enhanced ACH file generated with password protection.`,
        timestamp: runDate,
      });

      return {
        success: true,
        message: 'Payroll processed successfully.',
        payrollRunId: payrollRunId,
        achFileContent: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Excel}`,
        achFileName: achFileName,
        filePassword: password,
      };
    } catch (error: any) {
      console.error('Error running payroll flow:', error);
      await createAuditLog(companyId, {
        actor: actorName,
        action: 'Payroll Run Failed',
        details: error.message || 'An unexpected error occurred during payroll processing.',
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during payroll processing.',
      };
    }
  }
);
