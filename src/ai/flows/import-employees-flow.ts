// src/ai/flows/import-employees-flow.ts
'use server';

/**
 * @fileOverview Handles bulk import of employees from a CSV file.
 * 
 * - importEmployees - A server action that processes the CSV file.
 * 
 * Expected CSV columns:
 * - name (required)
 * - email (required)
 * - phone
 * - role
 * - departmentName
 * - branchName
 * - location
 * - workerType (Salaried, Hourly, Commission, Contract)
 * - salary
 * - hourlyRate
 * - allowances
 * - deductions
 * - annualLeaveBalance
 * - gender (Male, Female, Other)
 * - dateOfBirth (YYYY-MM-DD format)
 * - identificationType (ID Number, Passport, License)
 * - identificationNumber
 * - bankName
 * - accountNumber
 * - branchCode
 * - jobTitle
 * - contractType (Permanent, Fixed-Term, Internship)
 * - contractStartDate (YYYY-MM-DD format)
 * - contractEndDate (YYYY-MM-DD format)
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { type Employee, type Department, type Branch } from '@/lib/data';
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
    return { success: false, message: 'Missing file or company ID.', results: { successful: 0, failed: 0, errors: [] } };
  }

  const fileContent = await file.text();

  return importEmployeesFlow({ companyId, companyName, fileContent });
}

// Helper function to parse date string to ISO format
function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  try {
    // Try to parse various date formats
    const cleaned = dateStr.trim();
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return new Date(cleaned).toISOString();
    }
    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/');
      return new Date(`${year}-${month}-${day}`).toISOString();
    }
    // Handle MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [month, day, year] = cleaned.split('/');
      return new Date(`${year}-${month}-${day}`).toISOString();
    }
    // Try generic parsing
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // Return undefined if parsing fails
  }
  return undefined;
}

// Helper function to normalize column names (handle case and spacing variations)
function normalizeColumnName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, '').trim();
}

// Map potential column name variations to our expected field names
const columnMappings: Record<string, string> = {
  'name': 'name',
  'fullname': 'name',
  'employeename': 'name',
  'email': 'email',
  'emailaddress': 'email',
  'phone': 'phone',
  'phonenumber': 'phone',
  'mobile': 'phone',
  'mobilenumber': 'phone',
  'role': 'role',
  'jobrole': 'role',
  'position': 'role',
  'department': 'departmentName',
  'departmentname': 'departmentName',
  'dept': 'departmentName',
  'branch': 'branchName',
  'branchname': 'branchName',
  'office': 'branchName',
  'location': 'location',
  'city': 'location',
  'workertype': 'workerType',
  'employmenttype': 'workerType',
  'paytype': 'workerType',
  'salary': 'salary',
  'basesalary': 'salary',
  'monthlysalary': 'salary',
  'hourlyrate': 'hourlyRate',
  'rateperhour': 'hourlyRate',
  'allowances': 'allowances',
  'allowance': 'allowances',
  'deductions': 'deductions',
  'deduction': 'deductions',
  'annualleavebalance': 'annualLeaveBalance',
  'leavebalance': 'annualLeaveBalance',
  'annualleave': 'annualLeaveBalance',
  'gender': 'gender',
  'sex': 'gender',
  'dateofbirth': 'dateOfBirth',
  'dob': 'dateOfBirth',
  'birthdate': 'dateOfBirth',
  'birthday': 'dateOfBirth',
  'identificationtype': 'identificationType',
  'idtype': 'identificationType',
  'identificationnumber': 'identificationNumber',
  'idnumber': 'identificationNumber',
  'nationalid': 'identificationNumber',
  'passportnumber': 'identificationNumber',
  'bankname': 'bankName',
  'bank': 'bankName',
  'accountnumber': 'accountNumber',
  'accountno': 'accountNumber',
  'banknumber': 'accountNumber',
  'branchcode': 'branchCode',
  'bankbranchcode': 'branchCode',
  'sortcode': 'branchCode',
  'jobtitle': 'jobTitle',
  'title': 'jobTitle',
  'contracttype': 'contractType',
  'employmentstatus': 'contractType',
  'contractstartdate': 'contractStartDate',
  'startdate': 'contractStartDate',
  'hiredate': 'contractStartDate',
  'joindate': 'joinDate',
  'contractenddate': 'contractEndDate',
  'enddate': 'contractEndDate',
};

// Function to get normalized row data
function normalizeRowData(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    const mappedKey = columnMappings[normalizedKey] || key;
    normalized[mappedKey] = value;
  }

  return normalized;
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
      // Fetch departments
      const departmentsRef = ref(db, `companies/${companyId}/departments`);
      const departmentsSnap = await get(departmentsRef);
      const departments: Department[] = departmentsSnap.val() ? Object.values(departmentsSnap.val()) : [];

      // Fetch branches
      const branchesRef = ref(db, `companies/${companyId}/branches`);
      const branchesSnap = await get(branchesRef);
      const branches: Branch[] = branchesSnap.val() ? Object.values(branchesSnap.val()) : [];

      const { data, errors: parseErrors } = parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseErrors.length > 0) {
        console.error('CSV Parse errors:', parseErrors);
      }

      for (const rawRow of data as any[]) {
        // Normalize the row data to handle column name variations
        const row = normalizeRowData(rawRow);

        const email = row.email?.toString().trim();
        const name = row.name?.toString().trim();

        if (!email) {
          failed++;
          errors.push(`Row skipped: Missing email. Row data: ${JSON.stringify(row).substring(0, 100)}`);
          continue;
        }

        if (!name) {
          failed++;
          errors.push(`Row skipped for ${email}: Missing name.`);
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

          // Find matching department
          const department = departments.find(d =>
            d.name.toLowerCase() === row.departmentName?.toString().trim().toLowerCase()
          );

          // Find matching branch
          const branch = branches.find(b =>
            b.name.toLowerCase() === row.branchName?.toString().trim().toLowerCase()
          );

          // Parse worker type
          const workerTypeMap: Record<string, Employee['workerType']> = {
            'salaried': 'Salaried',
            'hourly': 'Hourly',
            'commission': 'Commission',
            'contract': 'Contract',
          };
          const workerType = workerTypeMap[row.workerType?.toString().toLowerCase().trim()] || 'Salaried';

          // Parse gender
          const genderMap: Record<string, 'Male' | 'Female' | 'Other'> = {
            'male': 'Male',
            'm': 'Male',
            'female': 'Female',
            'f': 'Female',
            'other': 'Other',
          };
          const gender = genderMap[row.gender?.toString().toLowerCase().trim()] || undefined;

          // Parse identification type
          const idTypeMap: Record<string, 'ID Number' | 'Passport' | 'License'> = {
            'id number': 'ID Number',
            'idnumber': 'ID Number',
            'id': 'ID Number',
            'nrc': 'ID Number',
            'passport': 'Passport',
            'license': 'License',
            'licence': 'License',
            'drivers license': 'License',
          };
          const identificationType = row.identificationType
            ? idTypeMap[row.identificationType.toString().toLowerCase().trim()]
            : undefined;

          // Parse contract type
          const contractTypeMap: Record<string, 'Permanent' | 'Fixed-Term' | 'Internship'> = {
            'permanent': 'Permanent',
            'full-time': 'Permanent',
            'fulltime': 'Permanent',
            'fixed-term': 'Fixed-Term',
            'fixedterm': 'Fixed-Term',
            'contract': 'Fixed-Term',
            'temporary': 'Fixed-Term',
            'internship': 'Internship',
            'intern': 'Internship',
          };
          const contractType = row.contractType
            ? contractTypeMap[row.contractType.toString().toLowerCase().trim()]
            : undefined;

          // Build the employee object with ALL fields
          const newEmployee: Employee = {
            id: user.uid,
            companyId: companyId,
            name: name,
            email: email,
            phone: row.phone?.toString().trim() || '',
            role: row.role?.toString().trim() || 'Employee',
            status: 'Active',
            avatar: `https://avatar.vercel.sh/${email}.png`,

            // Department & Branch
            departmentId: department?.id || 'unassigned',
            departmentName: department?.name || row.departmentName?.toString().trim() || 'Unassigned',
            branchId: branch?.id,
            branchName: branch?.name || row.branchName?.toString().trim(),
            location: row.location?.toString().trim() || '',

            // Payment Info
            workerType: workerType,
            salary: parseFloat(row.salary) || 0,
            hourlyRate: parseFloat(row.hourlyRate) || 0,
            hoursWorked: 0,
            allowances: parseFloat(row.allowances) || 0,
            deductions: parseFloat(row.deductions) || 0,
            overtime: 0,
            bonus: 0,
            reimbursements: 0,

            // Dates
            joinDate: parseDate(row.joinDate) || new Date().toISOString(),
            annualLeaveBalance: parseInt(row.annualLeaveBalance) || 21,

            // Personal Info
            gender: gender,
            dateOfBirth: parseDate(row.dateOfBirth),

            // Identification
            identificationType: identificationType,
            identificationNumber: row.identificationNumber?.toString().trim(),

            // Bank Details
            bankName: row.bankName?.toString().trim(),
            accountNumber: row.accountNumber?.toString().trim(),
            branchCode: row.branchCode?.toString().trim(),

            // Job Details
            jobTitle: row.jobTitle?.toString().trim() || row.role?.toString().trim(),

            // Contract Details
            contractType: contractType,
            contractStartDate: parseDate(row.contractStartDate),
            contractEndDate: parseDate(row.contractEndDate),
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
