
'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import {
  Users,
  Briefcase,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Wallet,
  CalendarCheck,
  Award,
  BookOpen,
  DollarSign,
  Menu,
  X,
  FileText,
  ShieldCheck,
  Network,
  Megaphone,
  Landmark,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, Funnel, FunnelChart, LabelList, Pie as RechartsPie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/careers', label: 'Jobs Centre' },
  { href: '/post-a-job', label: 'Post a Job' },
  { href: '/who-we-serve', label: 'Who We Serve' },
];

const features = [
  { 
    icon: <FileText className="h-6 w-6 text-primary" />, 
    title: "Automated Payroll", 
    description: "Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically." 
  },
  { 
    icon: <ShieldCheck className="h-6 w-6 text-primary" />, 
    title: "Compliance Management", 
    description: "Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine." 
  },
  { 
    icon: <Briefcase className="h-6 w-6 text-primary" />, 
    title: "Recruitment & Onboarding", 
    description: "From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place." 
  },
  { 
    icon: <Trophy className="h-6 w-6 text-primary" />, 
    title: "Performance & Training", 
    description: "Set goals, track performance with 360-degree feedback, and manage employee training programs." 
  },
  { 
    icon: <Users className="h-6 w-6 text-primary" />, 
    title: "Employee Self-Service", 
    description: "Empower your employees with a portal to manage their attendance, leave, and view payslips." 
  },
  { 
    icon: <BarChart3 className="h-6 w-6 text-primary" />, 
    title: "Insightful Reporting", 
    description: "Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and diversity." 
  }
];

const chartConfig: ChartConfig = {
  total: { label: 'Total Payroll', color: 'hsl(var(--chart-1))' },
  hires: { label: 'Hires', color: 'hsl(var(--chart-2))' },
  separations: { label: 'Separations', color: 'hsl(var(--destructive))' },
  employees: { label: "Employees", color: "hsl(var(--primary))" },
  Male: { label: 'Male', color: 'hsl(var(--chart-1))' },
  Female: { label: 'Female', color: 'hsl(var(--chart-2))' },
  New: { label: 'New', color: `hsl(var(--chart-1))` },
  Screening: { label: 'Screening', color: `hsl(var(--chart-2))` },
  Interview: { label: 'Interview', color: `hsl(var(--chart-3))` },
  Offer: { label: 'Offer', color: `hsl(var(--chart-4))` },
  Hired: { label: 'Hired', color: `hsl(var(--chart-5))` },
  average: { label: 'Avg Score', color: 'hsl(var(--chart-1))' },
  requisitions: { label: "Requisitions", color: "hsl(var(--chart-1))" },
  days: { label: "Days", color: "hsl(var(--chart-1))" },
  onTime: { label: 'On Time', color: 'hsl(var(--chart-2))' },
  late: { label: 'Late', color: 'hsl(var(--chart-3))' },
  hoursMet: { label: 'Target Hours Met', color: 'hsl(var(--chart-1))' },
  attendanceRate: { label: 'Attendance Rate', color: 'hsl(var(--chart-1))' },
  Annual: { label: 'Annual', color: 'hsl(var(--chart-1))' },
  Sick: { label: 'Sick', color: 'hsl(var(--chart-2))' },
  Unpaid: { label: 'Unpaid', color: 'hsl(var(--chart-3))' },
  Maternity: { label: 'Maternity', color: 'hsl(var(--chart-4))' },
  absences: { label: 'Absences', color: 'hsl(var(--destructive))' },
  napsa: { label: 'NAPSA', color: 'hsl(var(--chart-1))' },
  nhima: { label: 'NHIMA', color: 'hsl(var(--chart-2))' },
  paye: { label: 'PAYE', color: 'hsl(var(--chart-3))' },
  trained: { label: 'Trained Employees', color: 'hsl(var(--chart-1))' },
  hours: { label: 'Hours', color: 'hsl(var(--chart-1))' },
  performance: { label: 'Performance Score', color: 'hsl(var(--chart-1))' },
  averageSalary: { label: 'Average Salary', color: 'hsl(var(--chart-4))' },
  'On Leave': { label: 'On Leave', color: 'hsl(var(--chart-2))' },
  Resigned: { label: 'Resigned', color: 'hsl(var(--chart-5))' },
  Terminated: { label: 'Terminated', color: 'hsl(var(--destructive))' },
  Permanent: { label: 'Permanent', color: 'hsl(var(--chart-1))' },
  'Fixed-Term': { label: 'Fixed-Term', color: 'hsl(var(--chart-2))' },
  Internship: { label: 'Internship', color: 'hsl(var(--chart-3))' },
  Exceeds: { label: 'Exceeds', color: 'hsl(var(--chart-2))' },
  Meets: { label: 'Meets', color: 'hsl(var(--chart-1))' },
  'Needs Improvement': { label: 'Needs Improvement', color: 'hsl(var(--chart-5))' },
  count: { label: 'Top Performers', color: 'hsl(var(--chart-2))' },
  value: { label: 'Value' },
  Sales: { label: 'Sales', color: 'hsl(var(--chart-1))' },
  Engineering: { label: 'Engineering', color: 'hsl(var(--chart-2))' },
  Marketing: { label: 'Marketing', color: 'hsl(var(--chart-3))' },
  Support: { label: 'Support', color: 'hsl(var(--chart-4))' },
  HR: { label: 'HR', color: 'hsl(var(--chart-5))' },
  Leadership: { label: 'Leadership' },
  Technical: { label: 'Technical' },
  Compliance: { label: 'Compliance' },
};

const totalPayrollData = [ { month: 'Jan', total: 186000 }, { month: 'Feb', total: 305000 }, { month: 'Mar', total: 237000 }, { month: 'Apr', total: 173000 }, { month: 'May', total: 209000 }, { month: 'Jun', total: 214000 } ];
const turnoverData = [ { month: "Jan", hires: 10, separations: 2 }, { month: "Feb", hires: 12, separations: 3 }, { month: "Mar", hires: 5, separations: 1 }, { month: "Apr", hires: 15, separations: 4 }, { month: "May", hires: 8, separations: 2 }, { month: "Jun", hires: 11, separations: 1 } ];
const headcountData = [ { month: "Jan", employees: 50 }, { month: "Feb", employees: 55 }, { month: "Mar", employees: 58 }, { month: "Apr", employees: 62 }, { month: "May", employees: 65 }, { month: "Jun", employees: 70 } ];
const genderDistributionData = [ { name: 'Male', value: 40, fill: 'var(--color-Male)' }, { name: 'Female', value: 30, fill: 'var(--color-Female)' } ];
const candidatePipelineData = [ { value: 120, name: 'New', fill: chartConfig.New.color }, { value: 80, name: 'Screening', fill: chartConfig.Screening.color }, { value: 45, name: 'Interview', fill: chartConfig.Interview.color }, { value: 20, name: 'Offer', fill: chartConfig.Offer.color }, { value: 11, name: 'Hired', fill: chartConfig.Hired.color } ];
const productivityData = [ { department: 'Sales', average: 82 }, { department: 'Engineering', average: 95 }, { department: 'Marketing', average: 78 }, { department: 'Support', average: 88 }, { department: 'HR', average: 91 } ];
const requisitionsByDeptData = [ { name: 'Sales', requisitions: 5 }, { name: 'Engineering', requisitions: 8 }, { name: 'Marketing', requisitions: 2 } ];
const timeToHireData = [ { month: 'Jan', days: 25 }, { month: 'Feb', days: 30 }, { month: 'Mar', days: 28 } ];
const attendancePerformanceData = [ { label: 'Jan', onTime: 200, late: 20, hoursMet: 210 }, { label: 'Feb', onTime: 220, late: 25, hoursMet: 230 }, { label: 'Mar', onTime: 210, late: 18, hoursMet: 220 } ];
const attendanceRateData = [ { month: 'Jan', attendanceRate: 95 }, { month: 'Feb', attendanceRate: 96 }, { month: 'Mar', attendanceRate: 94 } ];
const leaveTypesData = [ { name: 'Annual', value: 40, fill: chartConfig.Annual.color }, { name: 'Sick', value: 15, fill: chartConfig.Sick.color }, { name: 'Unpaid', value: 5, fill: chartConfig.Unpaid.color } ];
const topDeptAbsenceData = [ { name: 'Sales', absences: 12 }, { name: 'Support', absences: 8 }, { name: 'Marketing', absences: 5 } ];
const monthlyContributionsData = [ { month: 'Jan', napsa: 10000, nhima: 2000, paye: 15000 }, { month: 'Feb', napsa: 11000, nhima: 2200, paye: 16000 } ];
const contributionBreakdownData = [ { name: 'NAPSA', value: 21000, fill: 'var(--color-napsa)' }, { name: 'NHIMA', value: 4200, fill: 'var(--color-nhima)' }, { name: 'PAYE', value: 31000, fill: 'var(--color-paye)' } ];
const trainedEmployeesData = [ { name: 'Sales', trained: 15 }, { name: 'Engineering', trained: 25 }, { name: 'Marketing', trained: 10 } ];
const trainingHoursData = [ { name: 'Leadership', hours: 50 }, { name: 'Technical', hours: 120 }, { name: 'Compliance', hours: 30 } ];
const trainingImpactData = [ { trainingHours: 10, performance: 80 }, { trainingHours: 20, performance: 85 }, { trainingHours: 5, performance: 75 } ];
const averageSalaryData = [ { name: 'Engineering', averageSalary: 95000 }, { name: 'Sales', averageSalary: 75000 }, { name: 'Marketing', averageSalary: 70000 } ];
const performanceRatingData = [ { name: 'Exceeds', value: 15, fill: 'var(--color-Exceeds)' }, { name: 'Meets', value: 45, fill: 'var(--color-Meets)' }, { name: 'Needs Improvement', value: 5, fill: 'var(--color-Needs Improvement)' } ];
const topPerformersData = [ { quarter: 'Q1 23', count: 5 }, { quarter: 'Q2 23', count: 8 }, { quarter: 'Q3 23', count: 7 } ];
const activeContractsData = [ { name: 'Permanent', count: 60, fill: 'var(--color-Permanent)' }, { name: 'Fixed-Term', count: 8, fill: 'var(--color-Fixed-Term)' }, { name: 'Internship', count: 2, fill: 'var(--color-Internship)' } ];
const employeeStatusData = [ { name: 'On Leave', count: 3, fill: 'var(--color-On Leave)' }, { name: 'Sick', count: 2, fill: 'var(--color-Sick)' }, { name: 'Terminated', count: 1, fill: 'var(--color-Terminated)' } ];
const deptHeadcountData = [ { name: 'Sales', employees: 20 }, { name: 'Engineering', employees: 30 }, { name: 'Marketing', employees: 15 } ];
const deptDistData = [ { name: 'Sales', value: 20, fill: 'hsl(var(--chart-1))' }, { name: 'Engineering', value: 30, fill: 'hsl(var(--chart-2))' }, { name: 'Marketing', value: 15, fill: 'hsl(var(--chart-3))' } ];


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Logo />
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
                 <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center justify-end space-x-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Get Started</Link>
            </Button>
          </div>
          
           <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                         <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                            <Logo />
                            <SheetClose asChild>
                                <Link href="#features">Features</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="#pricing">Pricing</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/careers">Jobs Centre</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/post-a-job">Post a Job</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/who-we-serve">Who We Serve</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/login">Login</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>
           </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-20 md:pt-32 pb-10 md:pb-16">
          <div className="container text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              The All-in-One HR Platform for Modern Businesses
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              VerticalSync automates your payroll, compliance, and HR processes, so you can focus on what matters most: your people.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Request a Demo</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Reporting Overview Section */}
        <section className="py-20 md:py-28 bg-muted/50">
            <div className="container">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Powerful Insights at a Glance
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        Visualize your entire HR landscape with our comprehensive reporting dashboard.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Card><CardHeader><CardTitle>Employee Headcount</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={headcountData}><XAxis dataKey="month" fontSize={10} /><YAxis hide /><Bar dataKey="employees" fill="var(--color-employees)" radius={4} /></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Turnover Rate</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><AreaChart data={turnoverData}><XAxis dataKey="month" fontSize={10} /><YAxis hide /><Area dataKey="hires" type="natural" fill="var(--color-hires)" fillOpacity={0.4} stroke="var(--color-hires)" stackId="a" /><Area dataKey="separations" type="natural" fill="var(--color-separations)" fillOpacity={0.4} stroke="var(--color-separations)" stackId="a" /></AreaChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Payroll Cost</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><LineChart data={totalPayrollData}><XAxis dataKey="month" fontSize={10}/><YAxis hide /><Line dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} dot={false} /></LineChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Gender Distribution</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RechartsPie data={genderDistributionData} dataKey="value" nameKey="name" innerRadius={40} strokeWidth={5}><Cell key="cell-0" fill="var(--color-Male)" /><Cell key="cell-1" fill="var(--color-Female)" /></RechartsPie></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Candidate Pipeline</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square min-h-[150px]"><FunnelChart layout="vertical"><Funnel dataKey="value" data={candidatePipelineData} nameKey="name"><LabelList position="center" fill="#fff" stroke="none" dataKey="name" fontSize={10} /></Funnel></FunnelChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Dept Productivity</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RadarChart data={productivityData}><PolarGrid /><PolarAngleAxis dataKey="department" fontSize={10} /><Radar dataKey="average" fill="var(--color-average)" fillOpacity={0.6} dot={{r: 2}} /></RadarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Open Requisitions</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={requisitionsByDeptData} layout="vertical"><YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={60} fontSize={10}/><XAxis type="number" hide /><Bar dataKey="requisitions" fill="var(--color-requisitions)" radius={2}><LabelList dataKey="requisitions" position="right" offset={4} fontSize={10} /></Bar></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Time-to-Hire</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><LineChart data={timeToHireData}><XAxis dataKey="month" fontSize={10}/><YAxis unit="d" fontSize={10}/><Line dataKey="days" stroke="var(--color-days)" strokeWidth={2}/></LineChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Attendance Performance</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><AreaChart data={attendancePerformanceData}><XAxis dataKey="label" fontSize={10} /><YAxis fontSize={10} /><Area dataKey="hoursMet" stroke="var(--color-hoursMet)" fill="var(--color-hoursMet)" stackId="a" /><Area dataKey="onTime" stroke="var(--color-onTime)" fill="var(--color-onTime)" stackId="a" /><Area dataKey="late" stroke="var(--color-late)" fill="var(--color-late)" stackId="a" /></AreaChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Attendance Rate</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><LineChart data={attendanceRateData}><XAxis dataKey="month" fontSize={10}/><YAxis unit="%" domain={[80, 100]} fontSize={10}/><Line dataKey="attendanceRate" stroke="var(--color-attendanceRate)" /></LineChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Leave Types</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RechartsPie data={leaveTypesData} dataKey="value" nameKey="name" innerRadius={40}><Cell key="cell-0" fill="var(--color-Annual)" /><Cell key="cell-1" fill="var(--color-Sick)" /><Cell key="cell-2" fill="var(--color-Unpaid)" /></RechartsPie></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Absenteeism by Dept</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={topDeptAbsenceData} layout="vertical"><YAxis dataKey="name" type="category" width={60} fontSize={10} /><XAxis type="number" hide /><Bar dataKey="absences" fill="var(--color-absences)" radius={2} /></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Statutory Contributions</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><LineChart data={monthlyContributionsData}><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} tickFormatter={(v) => `${v/1000}k`}/><Line dataKey="napsa" stroke="var(--color-napsa)" dot={false}/><Line dataKey="nhima" stroke="var(--color-nhima)" dot={false}/><Line dataKey="paye" stroke="var(--color-paye)" dot={false}/></LineChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Contribution Breakdown</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RechartsPie data={contributionBreakdownData} dataKey="value" nameKey="name" innerRadius={40}><Cell key="cell-0" fill="var(--color-napsa)" /><Cell key="cell-1" fill="var(--color-nhima)" /><Cell key="cell-2" fill="var(--color-paye)" /></RechartsPie></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Employees Trained</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={trainedEmployeesData} layout="vertical"><YAxis dataKey="name" type="category" width={60} fontSize={10}/><XAxis type="number" hide /><Bar dataKey="trained" fill="var(--color-trained)" radius={2}/></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Training Hours</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={trainingHoursData}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Bar dataKey="hours" stackId="a" fill="var(--color-hours)" /></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Training Impact</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><ScatterChart><XAxis type="number" dataKey="trainingHours" name="Training (h)" unit="h" fontSize={10}/><YAxis type="number" dataKey="performance" name="Performance" unit="%" fontSize={10}/><Scatter name="Employees" data={trainingImpactData} fill="var(--color-performance)" /></ScatterChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Salary by Department</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={averageSalaryData} layout="vertical"><YAxis dataKey="name" type="category" width={60} fontSize={10}/><XAxis type="number" hide /><Bar dataKey="averageSalary" fill="var(--color-averageSalary)" radius={2} /></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Performance Ratings</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RechartsPie data={performanceRatingData} dataKey="value" nameKey="name" innerRadius={40}><Cell key="cell-0" fill="var(--color-Exceeds)" /><Cell key="cell-1" fill="var(--color-Meets)" /><Cell key="cell-2" fill="var(--color-Needs Improvement)" /></RechartsPie></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Top Performers</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><LineChart data={topPerformersData}><XAxis dataKey="quarter" fontSize={10}/><YAxis allowDecimals={false} fontSize={10}/><Line dataKey="count" stroke="var(--color-count)" /></LineChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Active Contracts</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={activeContractsData}><XAxis dataKey="name" fontSize={10}/><YAxis hide /><Bar dataKey="count" radius={2}><Cell key="cell-0" fill="var(--color-Permanent)"/><Cell key="cell-1" fill="var(--color-Fixed-Term)"/><Cell key="cell-2" fill="var(--color-Internship)"/></Bar></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Employee Status</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={employeeStatusData} layout="vertical"><YAxis dataKey="name" type="category" width={60} fontSize={10} /><XAxis type="number" hide /><Bar dataKey="count" radius={2}><Cell key="cell-0" fill="var(--color-On Leave)"/><Cell key="cell-1" fill="var(--color-Sick)"/><Cell key="cell-2" fill="var(--color-Terminated)"/></Bar></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Department Headcount</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="min-h-[150px] w-full"><BarChart data={deptHeadcountData} layout="vertical"><YAxis dataKey="name" type="category" width={60} fontSize={10} /><XAxis type="number" hide /><Bar dataKey="employees" fill="var(--color-employees)" radius={2} /></BarChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[150px]"><RechartsPie data={deptDistData} dataKey="value" nameKey="name" innerRadius={40}><Cell key="cell-0" fill="var(--color-Sales)" /><Cell key="cell-1" fill="var(--color-Engineering)" /><Cell key="cell-2" fill="var(--color-Marketing)" /></RechartsPie></ChartContainer></CardContent></Card>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Everything you need. Nothing you don't.
                </h2>
                <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                    Discover a full suite of HR tools designed to streamline your operations and empower your team.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
        <footer className="border-t">
            <div className="container py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.</p>
                 <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/documentation">Documentation</Link>
                    <Link href="#">Terms of Service</Link>
                    <Link href="#">Privacy Policy</Link>
                </nav>
            </div>
        </footer>
    </div>
  );
}
