

import { db } from './firebase';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';

export type Company = {
    id: string;
    name: string;
    tpin: string;
    address: string;
    contactName: string;
    contactNumber: string;
    adminEmail: string;
    createdAt: string; // ISO 8601
    status: 'Pending' | 'Active' | 'Rejected' | 'Suspended';
};

export type WorkerType = 'Salaried' | 'Hourly' | 'Contractor';

export type Employee = {
  id: string;
  companyId: string; // Multi-tenancy key
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave' | 'Sick' | 'Pending Approval';
  avatar: string;
  location: string;
  departmentId: string;
  departmentName: string;
  workerType: WorkerType;
  salary: number; // For Salaried
  hourlyRate: number; // For Hourly
  hoursWorked: number; // For Hourly
  allowances: number;
  deductions: number; // Other deductions
  overtime: number; // Overtime hours
  bonus: number;
  reimbursements: number;
  joinDate: string; // ISO 8601 date string
  annualLeaveBalance: number;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string; // ISO 8601 date string
  identificationType?: 'ID Number' | 'Passport' | 'License';
  identificationNumber?: string;
  // Bank Details
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  jobTitle?: string; // Original job title before promotion
  adminRoleId?: string; // ID of the assigned admin Role
};

export type JobVacancy = {
  id: string;
  companyId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  description: string;
  status: 'Open' | 'Closed' | 'Archived';
  createdAt: string; // ISO 8601 date string
};

export const ApplicantStatus = {
  New: 'New',
  Screening: 'Screening',
  Interview: 'Interview',
  Offer: 'Offer',
  Onboarding: 'Onboarding',
  Hired: 'Hired',
  Rejected: 'Rejected',
} as const;

export type ApplicantStatus = (typeof ApplicantStatus)[keyof typeof ApplicantStatus];

export type OnboardingTask = {
    id: string;
    title: string;
    completed: boolean;
    dueDate: string | null;
};

export const defaultOnboardingTasks: Omit<OnboardingTask, 'id' | 'completed' | 'dueDate'>[] = [
    { title: 'Sign Employment Contract' },
    { title: 'Complete Personal Details Form' },
    { title: 'Submit Banking Information' },
    { title: 'Complete Tax & NAPSA Forms' },
    { title: 'Set up IT Equipment' },
    { title: 'Company Induction Meeting' },
];


export type Applicant = {
  id: string;
  companyId: string;
  jobVacancyId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string; // URL to the resume file in storage
  status: ApplicantStatus;
  appliedAt: string; // ISO 8601 date string
  onboardingTasks?: OnboardingTask[];
};

export type PayrollConfig = {
  employeeNapsaRate: number;
  employerNapsaRate: number;
  employeeNhimaRate: number;
  employerNhimaRate: number;
  taxRate: number;
  overtimeMultiplier: number;
  // Working Hours
  dailyTargetHours: number;
  weeklyTargetHours: number;
  monthlyTargetHours: number;
  yearlyTargetHours: number;
  allowedIpAddress?: string | null;
};

export type PayrollDetails = {
    basePay: number;
    overtimePay: number;
    grossPay: number;
    employeeNapsaDeduction: number;
    employerNapsaContribution: number;
    employeeNhimaDeduction: number;
    employerNhimaContribution: number;
    taxDeduction: number;
    totalDeductions: number;
    netPay: number;
}

export type PayrollRunEmployee = PayrollDetails & {
    employeeId: string;
    employeeName: string;
};

export type PayrollRun = {
  id: string;
  companyId: string;
  runDate: string; // ISO 8601 date string
  employeeCount: number;
  totalAmount: number;
  achFileName: string;
  employees: Record<string, PayrollRunEmployee>; // Keyed by employee ID
};


export type LeaveRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Annual' | 'Sick' | 'Unpaid' | 'Maternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type AttendanceRecord = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    checkInTime: string; // ISO 8601 string
    checkOutTime: string | null; // ISO 8601 string, null if not checked out
    status: 'Present' | 'Late' | 'Absent' | 'Auto Clock-out';
    // Enriched properties, not stored in DB
    departmentName?: string;
    role?: string;
    avatar?: string;
    email?: string;
}

export type Department = {
    id: string;
    companyId: string;
    name: string;
    minSalary: number;
    maxSalary: number;
};

export type Permission = 
    | 'dashboard'
    | 'employees'
    | 'recruitment'
    | 'payroll'
    | 'payment-methods'
    | 'leave'
    | 'attendance'
    | 'roster'
    | 'performance'
    | 'reporting'
    | 'organization'
    | 'compliance'
    | 'settings';


export const permissionsList: { id: Permission, label: string }[] = [
    { id: 'dashboard', label: 'View Dashboard' },
    { id: 'employees', label: 'Manage Employees' },
    { id: 'recruitment', label: 'Manage Recruitment' },
    { id: 'payroll', label: 'Manage Payroll' },
    { id: 'payment-methods', label: 'Manage Payment Methods' },
    { id: 'leave', label: 'Manage Leave' },
    { id: 'attendance', label: 'Manage Attendance' },
    { id: 'roster', label: 'Manage Roster' },
    { id: 'performance', label: 'Manage Performance' },
    { id: 'reporting', label: 'View Reporting' },
    { id: 'organization', label: 'Manage Organization' },
    { id: 'compliance', label: 'Access Compliance Advisor' },
    { id: 'settings', label: 'Manage Settings' },
];

export type Role = {
    id: string;
    companyId: string;
    name: string;
    departmentId: string;
    departmentName: string;
    permissions: Permission[];
};

export type Goal = {
  id: string;
  companyId: string;
  employeeId: string;
  title: string;
  description: string;
  status: 'On Track' | 'At Risk' | 'Completed' | 'Postponed';
  progress: number; // 0-100
  dueDate: string; // ISO 8601
};

export type PerformanceReview = {
  id: string;
  companyId: string;
  employeeId: string;
  reviewerId: string; // Manager's ID
  reviewDate: string; // ISO 8601
  status: 'Pending' | 'In Progress' | 'Completed';
  goals: Goal[];
  employeeSelfAssessment: string;
  managerFeedback: string;
  overallRating: 1 | 2 | 3 | 4 | 5;
};

export type Feedback = {
  id: string;
  companyId: string;
  subjectEmployeeId: string; // Employee being reviewed
  providerEmployeeId: string; // Employee giving feedback
  providerEmployeeName: string; // Denormalized for easy display
  feedbackDate: string; // ISO 8601
  isAnonymous: boolean;
  content: string;
  prompt: string;
  requestedFor: string[]; // Array of employee IDs asked to give feedback
};

export type Question = {
    id: string;
    text: string;
    type: 'multiple-choice' | 'short-answer';
    options?: string[];
};

export type TrainingCourse = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  questions: Question[];
};

export type Enrollment = {
  id: string;
  companyId: string;
  employeeId: string;
  courseId: string;
  enrollmentDate: string; // ISO 8601
  status: 'Enrolled' | 'In Progress' | 'Completed';
};

export type TrainingSubmission = {
    id: string;
    companyId: string;
    employeeId: string;
    courseId: string;
    submissionDate: string;
    answers: Record<string, string>; // questionId: answer
};

export type Certification = {
  id: string;
  companyId: string;
  employeeId: string;
  name: string;
  issuingBody: string;
  issueDate: string; // ISO 8601
  expiryDate?: string | null; // ISO 8601, optional
};

export type Bank = {
    id: string;
    companyId: string;
    name: string;
    swiftCode: string;
};

export type AuditLog = {
    id: string;
    companyId: string;
    actor: string; // Who performed the action (e.g., "System", "Admin User")
    action: string; // What was done (e.g., "Payroll Run Executed")
    details: string; // A descriptive summary
    timestamp: string; // ISO 8601
};

export type RosterAssignment = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    status: 'On Duty' | 'Off Day';
};

export type Notification = {
  id: string;
  companyId: string;
  userId: string; // The user who should receive the notification
  title: string;
  message: string;
  link: string; // Link to the relevant page
  isRead: boolean;
  timestamp: string; // ISO 8601 string
};

// Helper function to create a notification
export const createNotification = async (companyId: string, notification: Omit<Notification, 'id' | 'companyId' | 'isRead' | 'timestamp'>) => {
  try {
    const notificationsRef = ref(db, `companies/${companyId}/notifications`);
    const newNotificationRef = push(notificationsRef);
    const newNotification: Omit<Notification, 'id' | 'companyId'> = {
      ...notification,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    await set(newNotificationRef, { ...newNotification, id: newNotificationRef.key });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to get all admin user IDs for a company
export const getAdminUserIds = async (companyId: string): Promise<string[]> => {
    const employeesRef = ref(db, 'employees');
    const q = query(employeesRef, orderByChild('companyId'), equalTo(companyId));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        const companyEmployees: Record<string, Employee> = snapshot.val();
        const adminIds = Object.values(companyEmployees)
            .filter(employee => employee.role === 'Admin')
            .map(admin => admin.id);
        return adminIds;
    }
    return [];
};

export const calculatePayroll = (employee: Employee, config: PayrollConfig): PayrollDetails => {
    let basePay = 0;
    if (employee.workerType === 'Salaried') {
        basePay = employee.salary;
    } else if (employee.workerType === 'Hourly') {
        basePay = employee.hourlyRate * employee.hoursWorked;
    } else { // Contractor
        basePay = employee.salary; // Assuming salary field is used for contract amount
    }

    const overtimePay = employee.workerType === 'Hourly' 
        ? employee.overtime * employee.hourlyRate * config.overtimeMultiplier 
        : employee.overtime; // For salaried, assume 'overtime' is a flat amount

    const grossPay = basePay + overtimePay + employee.allowances + employee.bonus + employee.reimbursements;

    // For contractors, no statutory deductions are made
    if (employee.workerType === 'Contractor') {
        const totalDeductions = employee.deductions;
        const netPay = grossPay - totalDeductions;
        return {
            basePay,
            overtimePay,
            grossPay,
            employeeNapsaDeduction: 0,
            employerNapsaContribution: 0,
            employeeNhimaDeduction: 0,
            employerNhimaContribution: 0,
            taxDeduction: 0,
            totalDeductions,
            netPay
        };
    }

    const employeeNapsaDeduction = (grossPay * (config.employeeNapsaRate / 100));
    const employerNapsaContribution = (grossPay * (config.employerNapsaRate / 100));
    const employeeNhimaDeduction = (grossPay * (config.employeeNhimaRate / 100));
    const employerNhimaContribution = (grossPay * (config.employerNhimaRate / 100));

    const taxablePay = grossPay - employeeNapsaDeduction;
    const taxDeduction = (taxablePay * (config.taxRate / 100));

    const totalDeductions = employeeNapsaDeduction + employeeNhimaDeduction + taxDeduction + employee.deductions;
    const netPay = grossPay - totalDeductions;

    return { 
        basePay,
        overtimePay,
        grossPay, 
        employeeNapsaDeduction,
        employerNapsaContribution,
        employeeNhimaDeduction,
        employerNhimaContribution,
        taxDeduction,
        totalDeductions, 
        netPay 
    };
}
