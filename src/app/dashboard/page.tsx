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
  import { isThisMonth, parseISO } from 'date-fns';

  export default function Dashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, 'payrollConfig');
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
                const employeeList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
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
    }, []);

    const activeEmployeesCount = useMemo(() => {
        return employees.filter(e => e.status === 'Active').length;
    }, [employees]);

    const totalPayroll = useMemo(() => {
        if (!payrollConfig) return 0;
        return employees.reduce((total, employee) => {
            const details = calculatePayroll(employee, payrollConfig);
            return total + details.netPay;
        }, 0);
    }, [employees, payrollConfig]);

    const recentSignups = useMemo(() => {
        return employees.filter(e => isThisMonth(parseISO(e.joinDate))).slice(0, 5); // show latest 5
    }, [employees]);

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Payroll
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencyFormatter.format(totalPayroll)}</div>
                  <p className="text-xs text-muted-foreground">
                    Estimated for this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Employees
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeEmployeesCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently employed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
                   <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    No open issues
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Payroll Run</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Not Scheduled</div>
                  <p className="text-xs text-muted-foreground">
                    Setup a payroll schedule
                  </p>
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
        </div>
    )
  }
