

import { db } from './firebase';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { differenceInHours, startOfYear, endOfYear, eachDayOfInterval, getDay } from 'date-fns';

export type SubscriptionPlan = {
    id: string;
    name: string;
    price: number; // Monthly price
    jobPostings: number; // Number of job postings allowed
    features: string[];
};

export type CompanySubscription = {
    planId: string;
    status: 'active' | 'inactive' | 'trial' | 'past_due';
    jobPostingsRemaining: number;
    nextBillingDate: string; // ISO 8601
};

export type TermsAgreement = {
    version: string;
    acceptedAt: string; // ISO 8601
};

export type Company = {
    id: string;
    name: string;
    tpin: string;
    address: string;
    contactName: string;
    contactNumber: string;
    adminEmail: string;
    createdAt: string; // ISO 8601
    status: 'Pending' | 'Active' | 'Rejected' | 'Suspended' | 'Guest';
    subscription: CompanySubscription;
    termsAgreement: TermsAgreement;
    logoUrl?: string;
    enabledModules?: Permission[];
    employeePortalDisabled?: boolean;
};

export type Branch = {
    id: string;
    companyId: string;
    name: string;
    location: string;
    ipAddress?: string;
};

export type ThemeSettings = {
  background: { h: string; s: string; l: string };
  primary: { h: string; s: string; l: string };
  accent: { h: string; s: string; l: string };
};

export type WorkerType = 'Salaried' | 'Hourly' | 'Contractor';

export type EducationEntry = {
    id: string;
    institution: string;
    qualification: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
};

export type WorkExperienceEntry = {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
};


export type Employee = {
  id: string;
  companyId: string; // Multi-tenancy key
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave' | 'Sick' | 'Pending Approval' | 'Applicant' | 'GuestAdmin';
  avatar: string;
  location: string;
  departmentId: string;
  departmentName: string;
  branchId?: string;
  branchName?: string;
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
  themeSettings?: ThemeSettings;
  // Contract Details
  contractType?: 'Permanent' | 'Fixed-Term' | 'Internship';
  contractStartDate?: string; // ISO 8601
  contractEndDate?: string | null; // ISO 8601
  contractFileUrl?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
  resignationDate?: string | null;
  resignationReason?: string | null;
  // Applicant Profile
  education?: EducationEntry[];
  workExperience?: WorkExperienceEntry[];
  resumeUrl?: string;
};

export type ApplicationFormQuestion = {
    id: string;
    text: string;
    type: 'text' | 'textarea' | 'yesno';
    required: boolean;
};

export type JobVacancy = {
  id: string;
  companyId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  jobType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote';
  status: 'Open' | 'Closed' | 'Archived' | 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO 8601 date string
  closingDate: string; // ISO 8601 date string
  views?: number;
  customForm?: ApplicationFormQuestion[];
  applicationMethod?: 'internal' | 'email';
  applicationEmail?: string;
};

export type GuestJobVacancy = {
    id: string;
    companyName: string;
    companyEmail: string;
    title: string;
    departmentName: string;
    description: string;
    requirements?: string;
    location?: string;
    salary?: number;
    jobType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote';
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    closingDate: string;
    views?: number;
}

export const ApplicantStatus = {
  New: 'New',
  Screening: 'Screening',
  Interview: 'Interview',
  Offer: 'Offer',
  Onboarding: 'Onboarding',
  Hired: 'Hired',
  Rejected: 'Rejected',
  Accepted: 'Accepted'
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
  userId: string;
  companyId: string;
  jobVacancyId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string | null; // URL to the resume file in storage
  status: ApplicantStatus;
  appliedAt: string; // ISO 8601 date string
  onboardingTasks?: OnboardingTask[];
  source?: string;
  hiredAt?: string; // ISO 8601 date string
  answers?: Record<string, string>; // questionId: answer
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
  allowedIpAddress?: string | null; // This will now be legacy, branches will handle IPs
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
  sickNoteUrl?: string;
};

export type ResignationRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  submissionDate: string; // ISO 8601
  resignationDate: string; // ISO 8601
  reason: string;
  status: 'Pending' | 'Approved' | 'Withdrawn';
};

export type AttendanceRecord = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    checkInTime: string; // ISO 8601 string
    checkOutTime: string | null; // ISO 8601 string, null if not checked out
    status: 'Present' | 'Late' | 'Absent' | 'Auto Clock-out' | 'Early Out';
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
    | 'settings'
    | 'announcements'
    | 'finance';


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
    { id: 'announcements', label: 'Manage Announcements' },
    { id: 'finance', label: 'Manage Finance' },
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
    correctAnswer?: string;
};

export type TrainingCourse = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in hours
  questions: Question[];
};

export type Enrollment = {
  id: string;
  companyId: string;
  employeeId: string;
  courseId: string;
  enrollmentDate: string; // ISO 8601
  status: 'Enrolled' | 'In Progress' | 'Completed';
  score?: number; // Percentage score
};

export type TrainingSubmission = {
    id: string;
    companyId: string;
    employeeId: string;
    courseId: string;
    submissionDate: string;
    answers: Record<string, string>; // questionId: answer
    score: number; // Percentage score
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

export type Shift = {
    id: string;
    companyId: string;
    name: string;
    startTime: string; // e.g., "08:00"
    endTime: string; // e.g., "16:00"
    color: string; // e.g., "#3b82f6"
};

export type RosterAssignment = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    status: 'On Duty' | 'Off Day';
    shiftId?: string;
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    shiftColor?: string;
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

export type Announcement = {
  id: string;
  companyId: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string; // ISO 8601
  audience: 'all' | string[]; // 'all' or an array of department IDs
};

export type Testimonial = {
    id: string;
    companyId: string;
    companyName: string;
    authorName: string;
    authorTitle: string;
    testimonialText: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string; // ISO 8601
};

// FINANCE MODULE TYPES
export type Product = {
    id: string;
    companyId: string;
    name: string;
    price: number;
    quantityInStock: number;
};

export type Customer = {
    id: string;
    companyId: string;
    name: string;
    email: string;
    address: string;
};

export type LineItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type Invoice = {
    id: string;
    companyId: string;
    invoiceNumber: string;
    customerName: string;
    lineItems: LineItem[];
    totalAmount: number;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
    issueDate: string; // ISO 8601
    dueDate: string; // ISO 8601
};

export type Transaction = {
    id: string;
    companyId: string;
    type: 'Income' | 'Expense';
    amount: number;
    category: 'Sales' | 'Office Supplies' | 'Utilities' | 'Salaries' | 'Other';
    date: string; // ISO 8601
    description: string;
    invoiceId?: string;
};


// Helper function to create a notification
export const createNotification = async (companyId: string, notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
  try {
    const notificationsRef = ref(db, `companies/${companyId}/notifications`);
    const newNotificationRef = push(notificationsRef);
    const newNotification: Omit<Notification, 'id' | 'companyId'> = {
      ...notification,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    await set(newNotificationRef, { ...newNotification, id: newNotificationRef.key, companyId });
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
};

export type DepartmentProductivityScore = {
    department: string;
    average: number;
    scores: {
        attendance: number;
        hours: number;
        performance: number;
        goals: number;
    }
}

export const calculateProductivityScore = (
    employees: Employee[],
    departments: Department[],
    allAttendance: Record<string, Record<string, AttendanceRecord>>,
    reviews: PerformanceReview[],
    goals: Goal[],
    config: PayrollConfig | null
): DepartmentProductivityScore[] => {
    if (!config) return [];

    return departments.map(dept => {
        const deptEmployees = employees.filter(e => e.departmentId === dept.id && e.status === 'Active');
        if (deptEmployees.length === 0) return null;

        // 1. Attendance Consistency
        const yearStart = startOfYear(new Date());
        const yearEnd = endOfYear(new Date());
        const workDays = eachDayOfInterval({ start: yearStart, end: yearEnd }).filter(d => getDay(d) > 0 && getDay(d) < 6);
        const totalExpectedDays = deptEmployees.length * workDays.length;

        const totalAbsences = deptEmployees.reduce((acc, emp) => {
            return acc + workDays.filter(day => {
                 const dateStr = day.toISOString().split('T')[0];
                 const record = allAttendance[dateStr]?.[emp.id];
                 return !record || record.status === 'Absent';
            }).length;
        }, 0);
        
        const attendanceScore = totalExpectedDays > 0 ? ((totalExpectedDays - totalAbsences) / totalExpectedDays) * 100 : 0;

        // 2. Target Hours Met
        const deptAttendanceRecords = Object.values(allAttendance).flatMap(daily => Object.values(daily)).filter(r => deptEmployees.some(e => e.id === r.employeeId) && r.checkOutTime);
        const daysWithHoursMet = deptAttendanceRecords.filter(r => {
            const hoursWorked = differenceInHours(new Date(r.checkOutTime!), new Date(r.checkInTime));
            return hoursWorked >= config.dailyTargetHours;
        }).length;
        const hoursScore = deptAttendanceRecords.length > 0 ? (daysWithHoursMet / deptAttendanceRecords.length) * 100 : 0;

        // 3. Performance Ratings
        const deptReviews = reviews.filter(r => deptEmployees.some(e => e.id === r.employeeId));
        const totalRating = deptReviews.reduce((acc, r) => acc + r.overallRating, 0);
        const performanceScore = deptReviews.length > 0 ? (totalRating / (deptReviews.length * 5)) * 100 : 0;

        // 4. Goal Completion
        const deptGoals = goals.filter(g => deptEmployees.some(e => e.id === g.employeeId));
        const totalProgress = deptGoals.reduce((acc, g) => acc + g.progress, 0);
        const goalsScore = deptGoals.length > 0 ? totalProgress / deptGoals.length : 0;

        const scores = {
            attendance: Math.round(attendanceScore),
            hours: Math.round(hoursScore),
            performance: Math.round(performanceScore),
            goals: Math.round(goalsScore),
        };
        
        const average = (scores.attendance + scores.hours + scores.performance + scores.goals) / 4;

        return {
            department: dept.name,
            average: Math.round(average),
            scores,
        };

    }).filter(Boolean) as DepartmentProductivityScore[];
};



