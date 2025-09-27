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

export const employees: Employee[] = [
  {
    id: "EMP001",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    role: "Software Engineer",
    status: "Active",
    avatar: "https://picsum.photos/seed/1/40/40",
    location: "New York, USA",
    salary: 80000,
    allowances: 5000,
    deductions: 2000,
  },
  {
    id: "EMP002",
    name: "Bob Williams",
    email: "bob.w@example.com",
    role: "Product Manager",
    status: "Active",
    avatar: "https://picsum.photos/seed/2/40/40",
    location: "London, UK",
    salary: 95000,
    allowances: 7000,
    deductions: 3500,
  },
  {
    id: "EMP003",
    name: "Charlie Brown",
    email: "charlie.b@example.com",
    role: "UX Designer",
    status: "Inactive",
    avatar: "https://picsum.photos/seed/3/40/40",
    location: "Berlin, Germany",
    salary: 72000,
    allowances: 4000,
    deductions: 1800,
  },
  {
    id: "EMP004",
    name: "Diana Miller",
    email: "diana.m@example.com",
    role: "Data Scientist",
    status: "Active",
    avatar: "https://picsum.photos/seed/4/40/40",
    location: "Toronto, Canada",
    salary: 110000,
    allowances: 8000,
    deductions: 5000,
  },
  {
    id: "EMP005",
    name: "Ethan Davis",
    email: "ethan.d@example.com",
    role: "DevOps Engineer",
    status: "Active",
    avatar: "https://picsum.photos/seed/5/40/40",
    location: "Sydney, Australia",
    salary: 105000,
    allowances: 6500,
    deductions: 4200,
  },
];

export const getNetPay = (employee: Employee) => {
    return employee.salary + employee.allowances - employee.deductions;
}
