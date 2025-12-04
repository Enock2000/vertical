// src/ai/flows/import-employees-flow.ts
'use server';

/**
 * @fileOverview Handles bulk import of employees from a CSV file.
 * 
 * - importEmployees - A server action that processes the CSV file.
 * - Only name and email are required fields
 * - All other fields are optional and will be imported exactly as provided
 * - Missing fields are left undefined so HR can edit them later
 * 
 * Expected CSV columns (only name and email are required):
 * - name (required)
 * - email (required)
 * - phone
 * - role
 * - departmentName
 * - branchName
 * - location
 * - workerType (Salaried, Hourly, Commission, Contractor)
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

// Helper function to normalize column names
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
        transformHeader: (header: string) => header.trim(),
      });

      if (parseErrors.length > 0) {
        console.error('CSV Parse errors:', parseErrors);
      }

      for (const rawRow of data as any[]) {
        // Normalize the row data to handle column name variations
        const row = normalizeRowData(rawRow);

        const email = row.email?.toString().trim();
        const name = row.name?.toString().trim();

        // Only name and email are required
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

          // Find matching department (if provided)
          const department = row.departmentName
            ? departments.find(d => d.name.toLowerCase() === row.departmentName.toString().trim().toLowerCase())
            : undefined;

          // Find matching branch (if provided)
          const branch = row.branchName
            ? branches.find(b => b.name.toLowerCase() === row.branchName.toString().trim().toLowerCase())
            : undefined;

          // Helper to get string value or undefined (bypass empty values)
          const getValue = (val: any): string | undefined => {
            if (val === undefined || val === null) return undefined;
            const trimmed = val.toString().trim();
            return trimmed.length > 0 ? trimmed : undefined;
          };

          // Helper to get number or undefined (bypass empty values)
          const getNumber = (val: any): number | undefined => {
            if (val === undefined || val === null || val === '') return undefined;
            const num = parseFloat(val);
            return !isNaN(num) ? num : undefined;
          };

          // Parse worker type only if provided
          let workerType: Employee['workerType'] | undefined = undefined;
          if (row.workerType) {
            const workerTypeMap: Record<string, Employee['workerType']> = {
              'salaried': 'Salaried',
              'hourly': 'Hourly',
              'contractor': 'Contractor',
            };
            workerType = workerTypeMap[row.workerType.toString().toLowerCase().trim()];
          }

          // Parse gender only if provided
          let gender: 'Male' | 'Female' | 'Other' | undefined = undefined;
          if (row.gender) {
            const genderMap: Record<string, 'Male' | 'Female' | 'Other'> = {
              'male': 'Male',
              'm': 'Male',
              'female': 'Female',
              'f': 'Female',
              'other': 'Other',
            };
            gender = genderMap[row.gender.toString().toLowerCase().trim()];
          }

          // Parse identification type only if provided
          let identificationType: 'ID Number' | 'Passport' | 'License' | undefined = undefined;
          if (row.identificationType) {
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
            identificationType = idTypeMap[row.identificationType.toString().toLowerCase().trim()];
          }

          // Parse contract type only if provided
          let contractType: 'Permanent' | 'Fixed-Term' | 'Internship' | undefined = undefined;
          if (row.contractType) {
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
            contractType = contractTypeMap[row.contractType.toString().toLowerCase().trim()];
          }

          // Build the employee object - ONLY include fields that were provided in CSV
          // Missing/empty fields are left undefined so HR can edit later
          const newEmployee: Record<string, any> = {
            // System-generated fields (always required)
            id: user.uid,
            companyId: companyId,
            status: 'Active',
            avatar: `https://avatar.vercel.sh/${email}.png`,
            joinDate: parseDate(row.joinDate) || new Date().toISOString(),

            // Required fields from CSV
            name: name,
            email: email,
          };

          // Add optional fields ONLY if they have values in CSV
          const phone = getValue(row.phone);
          if (phone) newEmployee.phone = phone;

          const role = getValue(row.role);
          if (role) newEmployee.role = role;
          else newEmployee.role = 'Employee'; // Default role if not provided

          // Department
          if (department) {
            newEmployee.departmentId = department.id;
            newEmployee.departmentName = department.name;
          } else if (row.departmentName) {
            newEmployee.departmentId = 'unassigned';
            newEmployee.departmentName = getValue(row.departmentName) || 'Unassigned';
          } else {
            newEmployee.departmentId = 'unassigned';
            newEmployee.departmentName = 'Unassigned';
          }

          // Branch
          if (branch) {
            newEmployee.branchId = branch.id;
            newEmployee.branchName = branch.name;
          } else if (row.branchName) {
            newEmployee.branchName = getValue(row.branchName);
          }

          const location = getValue(row.location);
          if (location) newEmployee.location = location;
          else newEmployee.location = '';

          // Worker type and payment info
          if (workerType) newEmployee.workerType = workerType;
          else newEmployee.workerType = 'Salaried';

          const salary = getNumber(row.salary);
          if (salary !== undefined) newEmployee.salary = salary;
          else newEmployee.salary = 0;

          const hourlyRate = getNumber(row.hourlyRate);
          if (hourlyRate !== undefined) newEmployee.hourlyRate = hourlyRate;
          else newEmployee.hourlyRate = 0;

          // Always initialize these to 0
          newEmployee.hoursWorked = 0;
          newEmployee.overtime = 0;
          newEmployee.bonus = 0;
          newEmployee.reimbursements = 0;

          const allowances = getNumber(row.allowances);
          if (allowances !== undefined) newEmployee.allowances = allowances;
          else newEmployee.allowances = 0;

          const deductions = getNumber(row.deductions);
          if (deductions !== undefined) newEmployee.deductions = deductions;
          else newEmployee.deductions = 0;

          const annualLeaveBalance = getNumber(row.annualLeaveBalance);
          if (annualLeaveBalance !== undefined) newEmployee.annualLeaveBalance = annualLeaveBalance;
          else newEmployee.annualLeaveBalance = 21;

          // Personal info - ONLY if provided
          if (gender) newEmployee.gender = gender;

          const dateOfBirth = parseDate(row.dateOfBirth);
          if (dateOfBirth) newEmployee.dateOfBirth = dateOfBirth;

          // Identification - ONLY if provided
          if (identificationType) newEmployee.identificationType = identificationType;

          const identificationNumber = getValue(row.identificationNumber);
          if (identificationNumber) newEmployee.identificationNumber = identificationNumber;

          // Bank details - ONLY if provided
          const bankName = getValue(row.bankName);
          if (bankName) newEmployee.bankName = bankName;

          const accountNumber = getValue(row.accountNumber);
          if (accountNumber) newEmployee.accountNumber = accountNumber;

          const branchCode = getValue(row.branchCode);
          if (branchCode) newEmployee.branchCode = branchCode;

          // Job title - ONLY if provided
          const jobTitle = getValue(row.jobTitle);
          if (jobTitle) newEmployee.jobTitle = jobTitle;
          else if (role) newEmployee.jobTitle = role;

          // Contract details - ONLY if provided
          if (contractType) newEmployee.contractType = contractType;

          const contractStartDate = parseDate(row.contractStartDate);
          if (contractStartDate) newEmployee.contractStartDate = contractStartDate;

          const contractEndDate = parseDate(row.contractEndDate);
          if (contractEndDate) newEmployee.contractEndDate = contractEndDate;

          await set(ref(db, 'employees/' + user.uid), newEmployee);
          await sendNewEmployeeWelcomeEmail(newEmployee as Employee, companyName);

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
