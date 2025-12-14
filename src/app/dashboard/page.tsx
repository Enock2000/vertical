// src/app/dashboard/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Loader2,
  Cake,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Clock,
  UserCheck,
  UserMinus,
  Briefcase,
  Building2,
  CalendarDays,
  Plane,
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import type { Employee, PayrollConfig, LeaveRequest, AttendanceRecord } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { isThisMonth, parseISO, format, getMonth, lastDayOfMonth, differenceInDays, isToday, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, Area, AreaChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useAuth } from '@/app/auth-provider';

const chartConfig = {
  value: { label: 'Value' },
  payroll: { label: "Payroll", color: "hsl(var(--chart-1))" },
  employees: { label: "Employees", color: "hsl(var(--chart-2))" },
  compliance: { label: "Compliance", color: "hsl(var(--chart-3))" },
  attendance: { label: "Attendance", color: "hsl(var(--chart-4))" },
  leave: { label: "Leave", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const departmentColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Dashboard() {
  const { companyId, company, employee: currentUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceRecord>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const employeesRef = ref(db, 'employees');
    const configRef = ref(db, `companies/${companyId}/payrollConfig`);
    const leaveRef = ref(db, `companies/${companyId}/leaveRequests`);
    const attendanceRef = ref(db, `companies/${companyId}/attendance`);

    let loadCount = 0;
    const checkLoading = () => {
      loadCount++;
      if (loadCount >= 4) setLoading(false);
    };

    const unsubEmployees = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.role !== 'Admin');
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
      checkLoading();
    });

    const unsubConfig = onValue(configRef, (snapshot) => {
      setPayrollConfig(snapshot.val());
      checkLoading();
    });

    const unsubLeave = onValue(leaveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLeaveRequests(Object.keys(data).map(k => ({ ...data[k], id: k })));
      }
      checkLoading();
    });

    const unsubAttendance = onValue(attendanceRef, (snapshot) => {
      setAttendanceData(snapshot.val() || {});
      checkLoading();
    });

    return () => {
      unsubEmployees();
      unsubConfig();
      unsubLeave();
      unsubAttendance();
    };
  }, [companyId]);

  // Stats calculations
  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const onLeave = employees.filter(e => e.status === 'On Leave' || e.status === 'Sick');
    const newHires = employees.filter(e => e.joinDate && isThisMonth(parseISO(e.joinDate)));
    const offboarded = employees.filter(e => e.status === 'Offboarded');

    // Department distribution
    const departmentCounts: Record<string, number> = {};
    employees.forEach(e => {
      if (e.departmentName) {
        departmentCounts[e.departmentName] = (departmentCounts[e.departmentName] || 0) + 1;
      }
    });
    const departmentData = Object.entries(departmentCounts)
      .map(([name, count], i) => ({ name, count, fill: departmentColors[i % departmentColors.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Payroll
    let totalPayroll = 0;
    if (payrollConfig) {
      activeEmployees.forEach(emp => {
        const details = calculatePayroll(emp, payrollConfig);
        totalPayroll += details.netPay;
      });
    }

    // Leave stats
    const pendingLeave = leaveRequests.filter(l => l.status === 'Pending').length;
    const approvedLeave = leaveRequests.filter(l => l.status === 'Approved' && isThisMonth(parseISO(l.createdAt))).length;

    // Today's attendance
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAttendance = attendanceData[today] || {};
    const clockedInToday = Object.keys(todayAttendance).length;
    const attendanceRate = activeEmployees.length > 0 ? Math.round((clockedInToday / activeEmployees.length) * 100) : 0;

    // Birthdays this month
    const currentMonth = getMonth(new Date());
    const birthdaysThisMonth = employees.filter(e => {
      if (!e.dateOfBirth) return false;
      return getMonth(new Date(e.dateOfBirth)) === currentMonth;
    });

    // Days to payroll
    const lastDay = lastDayOfMonth(new Date());
    const daysToPayroll = differenceInDays(lastDay, new Date());

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      onLeave: onLeave.length,
      newHires: newHires.length,
      offboarded: offboarded.length,
      totalPayroll,
      departmentData,
      pendingLeave,
      approvedLeave,
      clockedInToday,
      attendanceRate,
      birthdaysThisMonth,
      daysToPayroll,
      lastDay,
    };
  }, [employees, payrollConfig, leaveRequests, attendanceData]);

  // Recent signups
  const recentSignups = useMemo(() => {
    return employees
      .filter(e => e.joinDate && isThisMonth(parseISO(e.joinDate)))
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 5);
  }, [employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-400/20 blur-3xl"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Admin'}! 👋
              </h1>
              <p className="mt-2 text-purple-100 text-lg">
                Welcome to <span className="font-semibold text-white">{company?.name || 'Your Company'}</span>
              </p>
              <p className="text-purple-200 text-sm mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link href="/dashboard/employees">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Employees
                </Link>
              </Button>
              <Button asChild className="bg-white text-purple-700 hover:bg-purple-50">
                <Link href="/dashboard/payroll">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Run Payroll
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Employees</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalEmployees}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <UserCheck className="h-3 w-3 mr-1" />
                {stats.activeEmployees} active
              </Badge>
              {stats.onLeave > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  {stats.onLeave} on leave
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payroll */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Monthly Payroll</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(stats.totalPayroll)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Estimated for {format(new Date(), 'MMMM')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Today's Attendance</CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.attendanceRate}%</div>
            <div className="mt-2">
              <Progress value={stats.attendanceRate} className="h-2 bg-amber-200 dark:bg-amber-800" />
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              {stats.clockedInToday} of {stats.activeEmployees} clocked in
            </p>
          </CardContent>
        </Card>

        {/* Next Payroll */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Next Payroll</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.daysToPayroll} days
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              {format(stats.lastDay, 'MMMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Distribution & Leave Stats */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Department Distribution */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Department Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.departmentData.length > 0 ? (
                  <div className="space-y-4">
                    {stats.departmentData.map((dept, i) => (
                      <div key={dept.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-muted-foreground">{dept.count} employees</span>
                        </div>
                        <Progress
                          value={(dept.count / stats.totalEmployees) * 100}
                          className="h-2"
                          style={{ '--progress-background': dept.fill } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No department data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave & HR Stats */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Leave & HR Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pending Requests</p>
                      <p className="text-sm text-muted-foreground">Awaiting approval</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{stats.pendingLeave}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">New Hires</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.newHires}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <UserMinus className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Offboarded</p>
                      <p className="text-sm text-muted-foreground">Total exits</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{stats.offboarded}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signups */}
          <Card className="shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Signups</CardTitle>
                <CardDescription>New employees who joined this month</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/employees">
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentSignups.length > 0 ? (
                <div className="space-y-4">
                  {recentSignups.map(employee => (
                    <div key={employee.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.departmentName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(employee.salary)}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {format(new Date(employee.joinDate), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p>No new hires this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1 col */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/employees">
                  <Users className="h-4 w-4 mr-3 text-blue-500" />
                  Add New Employee
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/payroll">
                  <DollarSign className="h-4 w-4 mr-3 text-emerald-500" />
                  Process Payroll
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/leave">
                  <Plane className="h-4 w-4 mr-3 text-amber-500" />
                  Review Leave Requests
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/reporting">
                  <TrendingUp className="h-4 w-4 mr-3 text-purple-500" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Birthdays This Month */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-500" />
                Birthdays This Month
              </CardTitle>
              <CardDescription>Celebrate with your team</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.birthdaysThisMonth.length > 0 ? (
                <div className="space-y-3">
                  {stats.birthdaysThisMonth.slice(0, 5).map(employee => (
                    <div key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback className="bg-pink-100 text-pink-600">
                          {employee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(employee.dateOfBirth!), 'MMMM d')}
                        </p>
                      </div>
                      <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
                        <Cake className="h-4 w-4 text-pink-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <Cake className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No birthdays this month</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">All Clear</p>
                  <p className="text-sm text-green-600 dark:text-green-400">No compliance issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
