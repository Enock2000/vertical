
// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  Activity,
  ArrowUpRight,
  DollarSign,
  Users,
  Loader2,
  Cake,
  ShieldCheck,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import type { Employee, PayrollConfig } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { isThisMonth, parseISO, format, getMonth, lastDayOfMonth } from 'date-fns';
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"
import { useAuth } from '@/app/auth-provider';

const chartConfig = {
  value: {
    label: 'Value',
  },
  payroll: {
    label: "Payroll",
    color: "hsl(var(--chart-1))",
  },
  employees: {
    label: "Employees",
    color: "hsl(var(--chart-2))",
  },
  compliance: {
    label: "Compliance",
    color: "hsl(var(--chart-3))"
  },
  payrollDate: {
    label: "Payroll Date",
    color: "hsl(var(--chart-4))"
  }
} satisfies ChartConfig

export default function Dashboard() {
  const { companyId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const employeesRef = ref(db, 'employees');
    const configRef = ref(db, `companies/${companyId}/payrollConfig`);
    let employeesLoaded = false;
    let configLoaded = false;

    const checkLoading = () => {
      if (employeesLoaded && configLoaded) {
        setLoading(false);
      }
    }

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter by company and exclude Admin role (company owner should not appear as employee)
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.role !== 'Admin');
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
      employeesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Firebase read failed (employees): " + error.name);
      employeesLoaded = true;
      checkLoading();
    });

    const configUnsubscribe = onValue(configRef, (snapshot) => {
      setPayrollConfig(snapshot.val());
      configLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Firebase read failed (payrollConfig): " + error.name);
      configLoaded = true;
      checkLoading();
    });

    return () => {
      employeesUnsubscribe();
      configUnsubscribe();
    };
  }, [companyId]);

  const activeEmployeesCount = useMemo(() => {
    return employees.filter(e => e.status === 'Active').length;
  }, [employees]);

  const totalPayroll = useMemo(() => {
    if (!payrollConfig) return 0;
    return employees.reduce((total, employee) => {
      if (employee.status !== 'Active') return total;
      const details = calculatePayroll(employee, payrollConfig);
      return total + details.netPay;
    }, 0);
  }, [employees, payrollConfig]);

  const recentSignups = useMemo(() => {
    return employees.filter(e => e.joinDate && isThisMonth(parseISO(e.joinDate))).slice(0, 5); // show latest 5
  }, [employees]);

  const birthdaysThisMonth = useMemo(() => {
    const currentMonth = getMonth(new Date());
    return employees.filter(e => {
      if (!e.dateOfBirth) return false;
      return getMonth(new Date(e.dateOfBirth)) === currentMonth;
    });
  }, [employees]);


  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const lastDay = lastDayOfMonth(new Date());

  const getDayWithSuffix = (date: Date) => {
    const day = format(date, 'd');
    if (day.endsWith('1') && day !== '11') return `${day}st`;
    if (day.endsWith('2') && day !== '12') return `${day}nd`;
    if (day.endsWith('3') && day !== '13') return `${day}rd`;
    return `${day}th`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 xl:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold">ZMW {totalPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Estimated for this month
                </p>
              </div>
              <ChartContainer config={chartConfig} className="w-16 h-16 -mr-4">
                <PieChart>
                  <Pie data={[{ value: 1 }]} dataKey="value" nameKey="name" innerRadius={18} outerRadius={24} >
                    <Cell fill="var(--color-payroll)" />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold">{activeEmployeesCount}</div>
                <p className="text-xs text-muted-foreground">
                  out of {employees.length} total
                </p>
              </div>
              <ChartContainer config={chartConfig} className="w-16 h-16 -mr-4">
                <PieChart>
                  <Pie data={[{ value: activeEmployeesCount }, { value: employees.length - activeEmployeesCount }]} dataKey="value" nameKey="name" innerRadius={18} outerRadius={24} >
                    <Cell fill="var(--color-employees)" />
                    <Cell fill="var(--color-muted)" opacity={0.3} />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No open issues
                </p>
              </div>
              <ChartContainer config={chartConfig} className="w-16 h-16 -mr-4">
                <PieChart>
                  <Pie data={[{ value: 1 }]} dataKey="value" nameKey="name" innerRadius={18} outerRadius={24} >
                    <Cell fill="var(--color-compliance)" />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payroll Run</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold">{getDayWithSuffix(lastDay)}</div>
                <p className="text-xs text-muted-foreground">
                  {format(lastDay, "MMMM")}
                </p>
              </div>
              <ChartContainer config={chartConfig} className="w-16 h-16 -mr-4">
                <PieChart>
                  <Pie data={[{ value: new Date().getDate() }, { value: lastDay.getDate() - new Date().getDate() }]} dataKey="value" nameKey="name" innerRadius={18} outerRadius={24} >
                    <Cell fill="var(--color-payrollDate)" />
                    <Cell fill="var(--color-muted)" opacity={0.3} />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Recent payroll transactions from your store.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/payroll">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Type
                  </TableHead>
                  <TableHead className="hidden xl:table-column">
                    Status
                  </TableHead>
                  <TableHead className="hidden xl:table-column">
                    Date
                  </TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No recent transactions.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>
              New employees who joined this month.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            {recentSignups.length > 0 ? (
              recentSignups.map(employee => (
                <div key={employee.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={employee.avatar} alt="Avatar" />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                  <div className="ml-auto font-medium">{currencyFormatter.format(employee.salary)}</div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No recent signups.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Birthdays This Month</CardTitle>
            <CardDescription>Upcoming employee birthdays.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {birthdaysThisMonth.length > 0 ? (
              birthdaysThisMonth.map(employee => (
                <div key={employee.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(employee.dateOfBirth!), 'MMMM d')}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Cake className="h-5 w-5 text-primary" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                No birthdays this month.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
