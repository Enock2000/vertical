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
  deductions: number;
  overtime: number;
  bonus: number;
  reimbursements: number;
};

export type PayrollDetails = {
    grossPay: number;
    totalDeductions: number;
    netPay: number;
}

export const calculatePayroll = (employee: Employee): PayrollDetails => {
    let grossPay = 0;
    if (employee.workerType === 'Salaried') {
        grossPay = employee.salary;
    } else if (employee.workerType === 'Hourly') {
        grossPay = employee.hourlyRate * employee.hoursWorked;
    } else { // Contractor
        grossPay = employee.salary; // Assuming salary field is used for contract amount
    }

    grossPay += employee.allowances + employee.overtime + employee.bonus + employee.reimbursements;
    const totalDeductions = employee.deductions;
    const netPay = grossPay - totalDeductions;

    return { grossPay, totalDeductions, netPay };
}
