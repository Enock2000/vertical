export type WorkerType = 'Salaried' | 'Hourly' | 'Contractor';

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  location: string;
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
};

export type PayrollConfig = {
  napsaRate: number;
  nhimaRate: number;
  taxRate: number;
  overtimeMultiplier: number;
};

export type PayrollDetails = {
    basePay: number;
    overtimePay: number;
    grossPay: number;
    napsaDeduction: number;
    nhimaDeduction: number;
    taxDeduction: number;
    totalDeductions: number;
    netPay: number;
}

export type LeaveRequest = {
  id: string;
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
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    checkInTime: string; // ISO 8601 string
    checkOutTime: string | null; // ISO 8601 string, null if not checked out
    status: 'Present' | 'Late';
}

export type Department = {
    id: string;
    name: string;
};

export type Permission = 
    | 'manage-employees'
    | 'view-employees'
    | 'manage-payroll'
    | 'view-payroll'
    | 'manage-leave'
    | 'view-leave'
    | 'manage-reporting'
    | 'view-reporting'
    | 'manage-settings';

export const permissionsList: { id: Permission, label: string }[] = [
    { id: 'manage-employees', label: 'Manage Employees (Add, Edit, Delete)' },
    { id: 'view-employees', label: 'View Employees' },
    { id: 'manage-payroll', label: 'Manage Payroll (Run, Approve)' },
    { id: 'view-payroll', label: 'View Payroll' },
    { id: 'manage-leave', label: 'Manage Leave Requests (Approve, Reject)' },
    { id: 'view-leave', label: 'View Leave Requests' },
    { id: 'manage-reporting', label: 'Manage Reporting' },
    { id: 'view-reporting', label: 'View Reporting' },
    { id: 'manage-settings', label: 'Manage System Settings' },
];

export type Role = {
    id: string;
    name: string;
    departmentId: string;
    departmentName: string;
    permissions: Permission[];
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
            napsaDeduction: 0,
            nhimaDeduction: 0,
            taxDeduction: 0,
            totalDeductions,
            netPay
        };
    }

    const napsaDeduction = (grossPay * (config.napsaRate / 100));
    const nhimaDeduction = (grossPay * (config.nhimaRate / 100));
    const taxablePay = grossPay - napsaDeduction;
    const taxDeduction = (taxablePay * (config.taxRate / 100));

    const totalDeductions = napsaDeduction + nhimaDeduction + taxDeduction + employee.deductions;
    const netPay = grossPay - totalDeductions;

    return { 
        basePay,
        overtimePay,
        grossPay, 
        napsaDeduction,
        nhimaDeduction,
        taxDeduction,
        totalDeductions, 
        netPay 
    };
}
