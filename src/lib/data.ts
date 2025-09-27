export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  avatar: string;
  location: string;
  salary: number;
  allowances: number;
  deductions: number;
};

export const employees: Employee[] = [];

export const getNetPay = (employee: Employee) => {
    return employee.salary + employee.allowances - employee.deductions;
}
