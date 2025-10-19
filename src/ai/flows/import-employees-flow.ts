// src/ai/flows/import-employees-flow.ts
'use server';

/**
 * @fileOverview Handles bulk import of employees from a CSV file.
 * 
 * - importEmployees - A server action that processes the CSV file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { type Employee, type Department } from '@/lib/data';
import { sendNewEmployeeWelcomeEmail } from '@/lib/email';
import { parse } from 'papaparse';


const ImportInputSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  fileContent: z.string(),
});

const ImportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  results: z.object({
    successful: z.number(),
    failed: z.number(),
    errors: z.array(z.string()),
  }),
});

export async function importEmployees(
  formData: FormData
): Promise<z.infer<typeof ImportOutputSchema>> {
    const file = formData.get('csvFile') as File | null;
    const companyId = formData.get('companyId') as string;
    const companyName = formData.get('companyName') as string;

    if (!file || !companyId) {
        return { success: false, message: 'Missing file or company ID.', results: { successful: 0, failed: 0, errors: [] }};
    }
    
    const fileContent = await file.text();

    return importEmployeesFlow({ companyId, companyName, fileContent });
}


const importEmployeesFlow = ai.defineFlow(
  {
    name: 'importEmployeesFlow',
    inputSchema: ImportInputSchema,
    outputSchema: ImportOutputSchema,
  },
  async ({ companyId, companyName, fileContent }) => {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
        const departmentsRef = ref(db, `companies/${companyId}/departments`);
        const departmentsSnap = await get(departmentsRef);
        const departments: Department[] = departmentsSnap.val() ? Object.values(departmentsSnap.val()) : [];

        const { data } = parse(fileContent, { header: true, skipEmptyLines: true });
        
        for (const row of data as any[]) {
            const email = row.email?.trim();
            if (!email) {
                failed++;
                errors.push(`Row skipped: Missing email.`);
                continue;
            }

            try {
                // Check if user already exists
                const userQuery = query(ref(db, 'employees'), orderByChild('email'), equalTo(email));
                const existingUserSnap = await get(userQuery);
                if (existingUserSnap.exists()) {
                    failed++;
                    errors.push(`Failed for ${email}: User with this email already exists.`);
                    continue;
                }

                // Temporary password (user will reset it)
                const tempPassword = Math.random().toString(36).slice(-8);
                const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
                const user = userCredential.user;

                const department = departments.find(d => d.name.toLowerCase() === row.departmentName?.trim().toLowerCase());

                const newEmployee: Employee = {
                    id: user.uid,
                    companyId: companyId,
                    name: row.name || 'No Name Provided',
                    email: email,
                    role: row.role || 'Employee',
                    status: 'Active',
                    avatar: `https://avatar.vercel.sh/${email}.png`,
                    departmentId: department?.id || 'unassigned',
                    departmentName: department?.name || 'Unassigned',
                    location: row.location || '',
                    workerType: (row.workerType as Employee['workerType']) || 'Salaried',
                    salary: parseFloat(row.salary) || 0,
                    hourlyRate: parseFloat(row.hourlyRate) || 0,
                    hoursWorked: 0, // Default, can be adjusted
                    allowances: 0,
                    deductions: 0,
                    overtime: 0,
                    bonus: 0,
                    reimbursements: 0,
                    joinDate: new Date().toISOString(),
                    annualLeaveBalance: parseInt(row.annualLeaveBalance) || 21,
                    phone: row.phone || '',
                };
                
                await set(ref(db, 'employees/' + user.uid), newEmployee);
                await sendNewEmployeeWelcomeEmail(newEmployee, companyName);
                
                successful++;

            } catch (error: any) {
                failed++;
                errors.push(`Failed for ${email}: ${error.message}`);
            }
        }
        
        return {
            success: true,
            message: `Import completed. ${successful} employees added, ${failed} failed.`,
            results: { successful, failed, errors }
        };

    } catch (error: any) {
      console.error("Error importing employees:", error);
      return { 
          success: false, 
          message: error.message || 'An unexpected error occurred during import.',
          results: { successful, failed, errors }
      };
    }
  }
);
