// src/ai/flows/run-payroll-flow.ts
'use server';

/**
 * @fileOverview A secure flow to process payroll and generate an ACH-compatible CSV file.
 *
 * - runPayrollFlow - Processes payroll for all active employees and returns a CSV file.
 * - PayrollRunOutput - The return type for the runPayrollFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, get, set, push, child } from 'firebase/database';
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

const PayrollRunOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  payrollRunId: z.string().optional(),
  achFileContent: z.string().optional().describe('Base64 encoded CSV content.'),
});

export type PayrollRunOutput = z.infer<typeof PayrollRunOutputSchema>;

export async function runPayroll(): Promise<PayrollRunOutput> {
  return runPayrollFlow({});
}

// Helper function to create an audit log
async function createAuditLog(log: Omit<AuditLog, 'id'>) {
    const logRef = ref(db, 'auditLogs');
    const newLogRef = push(logRef);
    await set(newLogRef, { ...log, id: newLogRef.key });
}

const runPayrollFlow = ai.defineFlow(
  {
    name: 'runPayrollFlow',
    inputSchema: z.object({}),
    outputSchema: PayrollRunOutputSchema,
  },
  async () => {
    try {
      // 1. Fetch payroll configuration
      const configRef = ref(db, 'payrollConfig');
      const configSnapshot = await get(configRef);
      const config: PayrollConfig | null = configSnapshot.val();
      if (!config) {
        return { success: false, message: 'Payroll configuration not found. Please set it up in Settings.' };
      }

      // 2. Fetch all active employees
      const employeesRef = ref(db, 'employees');
      const employeesSnapshot = await get(employeesRef);
      const allEmployees: Record<string, Employee> = employeesSnapshot.val();
      const activeEmployees = Object.values(allEmployees).filter(e => e.status === 'Active');

      if (activeEmployees.length === 0) {
        return { success: false, message: 'No active employees found to process payroll for.' };
      }

      // 3. Process payroll for each employee and create records
      let totalAmount = 0;
      const payrollRunEmployees: Record<string, PayrollRunEmployee> = {};
      
      for (const employee of activeEmployees) {
        if (!employee.bankName || !employee.accountNumber) {
            console.warn(`Skipping employee ${employee.name} (ID: ${employee.id}) due to missing bank details.`);
            continue; // Skip employees without bank details
        }
        const payrollDetails = calculatePayroll(employee, config);
        totalAmount += payrollDetails.netPay;

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

      // 4. Create the main payroll run record
      const runDate = new Date().toISOString();
      const payrollRunsRef = ref(db, 'payrollRuns');
      const newPayrollRunRef = push(payrollRunsRef);
      const payrollRunId = newPayrollRunRef.key!;

      const payrollRunData: PayrollRun = {
        id: payrollRunId,
        runDate,
        employeeCount,
        totalAmount,
        achFileName: `ACH-PAYROLL-${format(new Date(runDate), 'yyyy-MM-dd')}.csv`,
        employees: payrollRunEmployees,
      };

      await set(newPayrollRunRef, payrollRunData);

      // 5. Generate the ACH CSV file content
      const csvHeaders = 'EmployeeName,BankName,AccountNumber,BranchCode,Amount\n';
      const csvRows = activeEmployees
        .filter(e => e.id in payrollRunEmployees) // Only include employees that were processed
        .map(employee => {
            const details = payrollRunEmployees[employee.id];
            return `${employee.name},${employee.bankName},${employee.accountNumber},${employee.branchCode || ''},${details.netPay.toFixed(2)}`;
        })
        .join('\n');
      
      const csvContent = csvHeaders + csvRows;
      const base64Csv = Buffer.from(csvContent).toString('base64');

      // 6. Create an audit log for the successful payroll run
      await createAuditLog({
          actor: 'System',
          action: 'Payroll Run Executed',
          details: `Processed payroll for ${employeeCount} employees. Total amount: ${totalAmount.toFixed(2)}. ACH file generated.`,
          timestamp: runDate,
      });
      
      return {
        success: true,
        message: 'Payroll processed successfully.',
        payrollRunId: payrollRunId,
        achFileContent: `data:text/csv;base64,${base64Csv}`,
      };
    } catch (error: any) {
      console.error('Error running payroll flow:', error);
       await createAuditLog({
          actor: 'System',
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