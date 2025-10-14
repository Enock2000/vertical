
// src/app/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { BarChart, CheckCircle, FileText, Briefcase, ShieldCheck, Trophy, Users, Zap, Menu, X, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import HeadcountChart from './dashboard/reporting/components/headcount-chart';
import TurnoverChart from './dashboard/reporting/components/turnover-chart';
import DepartmentHeadcountChart from './dashboard/reporting/components/department-headcount-chart';
import DepartmentDistributionChart from './dashboard/reporting/components/department-distribution-chart';
import ActiveContractsChart from './dashboard/reporting/components/active-contracts-chart';
import EmployeeStatusChart from './dashboard/reporting/components/employee-status-chart';
import AttendancePerformanceChart from './dashboard/reporting/components/attendance-performance-chart';
import TotalPayrollChart from './dashboard/reporting/components/total-payroll-chart';
import PayrollByDepartmentChart from './dashboard/reporting/components/payroll-by-department-chart';
import AverageSalaryChart from './dashboard/reporting/components/average-salary-chart';
import PerformanceRatingChart from './dashboard/reporting/components/performance-rating-chart';
import AverageProductivityChart from './dashboard/reporting/components/average-productivity-chart';
import TopPerformersChart from './dashboard/reporting/components/top-performers-chart';
import AttendanceRateChart from './dashboard/reporting/components/attendance-rate-chart';
import LeaveTypesChart from './dashboard/reporting/components/leave-types-chart';
import TopDepartmentsAbsenteeismChart from './dashboard/reporting/components/top-departments-absenteeism-chart';
import MonthlyContributionsChart from './dashboard/reporting/components/monthly-contributions-chart';
import ContributionBreakdownChart from './dashboard/reporting/components/contribution-breakdown-chart';
import EmployeesTrainedChart from './dashboard/reporting/components/employees-trained-chart';
import TrainingHoursChart from './dashboard/reporting/components/training-hours-chart';
import TrainingImpactChart from './dashboard/reporting/components/training-impact-chart';
import GenderDistributionChart from './dashboard/reporting/components/gender-distribution-chart';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Testimonial, SubscriptionPlan, Employee, Department, LeaveRequest, ResignationRequest, PayrollRun, PerformanceReview, Goal, TrainingCourse, Enrollment, AttendanceRecord } from '@/lib/data';
import { calculateProductivityScore } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { subDays } from 'date-fns';

type HeroImage = {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
};

const featuresList = [
    {
      icon: <FileText />,
      title: 'Automated Payroll',
      description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
    },
    {
      icon: <ShieldCheck />,
      title: 'Compliance Management',
      description: 'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.',
    },
    {
      icon: <Briefcase />,
      title: 'Recruitment & Onboarding',
      description: 'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
    },
    {
      icon: <Trophy />,
      title: 'Performance & Training',
      description: 'Set goals, track performance with 360-degree feedback, and manage employee training programs.',
    },
    {
      icon: <Users />,
      title: 'Employee Self-Service',
      description: 'Empower your employees with a portal to manage their attendance, leave, and view payslips.',
    },
    {
      icon: <BarChart3 />,
      title: 'Insightful Reporting',
      description: 'Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and diversity.',
    },
];

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "/careers", label: "Jobs Centre" },
    { href: "/who-we-serve", label: "Who We Serve" },
    { href: "/pricing", label: "Pricing" },
];

// Mock data for charts
const mockDepartments: Department[] = [
  { id: 'dept0', name: 'Engineering', companyId: 'comp1', minSalary: 60000, maxSalary: 120000 },
  { id: 'dept1', name: 'Product', companyId: 'comp1', minSalary: 70000, maxSalary: 130000 },
  { id: 'dept2', name: 'Sales', companyId: 'comp1', minSalary: 50000, maxSalary: 100000 },
  { id: 'dept3', name: 'Marketing', companyId: 'comp1', minSalary: 55000, maxSalary: 110000 },
];

const mockEmployees: Employee[] = Array.from({ length: 50 }, (_, i) => ({
  id: `emp${i}`,
  companyId: 'comp1',
  name: `Employee ${i}`,
  email: `emp${i}@test.com`,
  role: i % 5 === 0 ? 'Manager' : 'Developer',
  status: i % 10 === 0 ? 'Inactive' : 'Active',
  avatar: '',
  location: 'Lusaka',
  departmentId: `dept${i % 4}`,
  departmentName: mockDepartments[i % 4].name,
  workerType: 'Salaried',
  salary: 50000 + Math.random() * 50000,
  hourlyRate: 0,
  hoursWorked: 0,
  allowances: 1000,
  deductions: 500,
  overtime: 0,
  bonus: 0,
  reimbursements: 0,
  joinDate: new Date(2022, i % 12, (i % 28) + 1).toISOString(),
  annualLeaveBalance: 21,
  gender: i % 3 === 0 ? 'Male' : 'Female',
  contractType: i % 4 === 0 ? 'Fixed-Term' : 'Permanent',
} as Employee));


const mockLeaveRequests: LeaveRequest[] = Array.from({ length: 20 }, (_, i) => ({
    id: `leave${i}`,
    companyId: 'comp1',
    employeeId: `emp${i}`,
    employeeName: `Employee ${i}`,
    leaveType: ['Annual', 'Sick', 'Unpaid'][i % 3] as any,
    startDate: new Date(2023, i % 12, 1).toISOString(),
    endDate: new Date(2023, i % 12, 5).toISOString(),
    reason: 'Vacation',
    status: 'Approved',
}));

const mockResignationRequests: ResignationRequest[] = Array.from({ length: 5 }, (_, i) => ({
    id: `resign${i}`,
    companyId: 'comp1',
    employeeId: `emp${i + 45}`,
    employeeName: `Employee ${i + 45}`,
    submissionDate: new Date(2023, i, 1).toISOString(),
    resignationDate: new Date(2023, i + 1, 1).toISOString(),
    reason: 'New opportunity',
    status: 'Approved'
}));

const mockPayrollRuns: PayrollRun[] = Array.from({ length: 6 }, (_, i) => ({
    id: `run${i}`,
    companyId: 'comp1',
    runDate: new Date(2023, i, 28).toISOString(),
    employeeCount: 45,
    totalAmount: 45 * 60000,
    achFileName: '',
    employees: Object.fromEntries(
        mockEmployees.slice(0,45).map(emp => [emp.id, {
            employeeId: emp.id,
            employeeName: emp.name,
            basePay: emp.salary,
            overtimePay: 0,
            grossPay: emp.salary + emp.allowances,
            employeeNapsaDeduction: emp.salary * 0.05,
            employerNapsaContribution: emp.salary * 0.05,
            employeeNhimaDeduction: emp.salary * 0.01,
            employerNhimaContribution: emp.salary * 0.01,
            taxDeduction: emp.salary * 0.20,
            totalDeductions: emp.salary * (0.05 + 0.01 + 0.20),
            netPay: (emp.salary + emp.allowances) - (emp.salary * (0.05 + 0.01 + 0.20))
        }])
    )
}));

const mockReviews: PerformanceReview[] = Array.from({ length: 30 }, (_, i) => ({
    id: `review${i}`,
    companyId: 'comp1',
    employeeId: `emp${i}`,
    reviewerId: 'emp0',
    reviewDate: new Date(2023, (i % 4) * 3, 1).toISOString(),
    status: 'Completed',
    goals: [],
    employeeSelfAssessment: '',
    managerFeedback: '',
    overallRating: ((i % 5) + 1) as any,
}));

const mockAllAttendance: Record<string, Record<string, AttendanceRecord>> = {};
mockEmployees.filter(e => e.status === 'Active').forEach(emp => {
    for (let i = 0; i < 90; i++) {
        const date = subDays(new Date(), i);
        const dateString = date.toISOString().split('T')[0];
        if (!mockAllAttendance[dateString]) {
            mockAllAttendance[dateString] = {};
        }
        const isAbsent = Math.random() < 0.1;
        const baseRecord = {
          id: `${dateString}-${emp.id}`,
          companyId: 'comp1',
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateString,
          departmentName: emp.departmentName, // Added department name
        };

        if (!isAbsent) {
            const checkIn = new Date(date);
            checkIn.setHours(8, Math.floor(Math.random() * 30));
            const checkOut = new Date(date);
            checkOut.setHours(17, Math.floor(Math.random() * 30));
            mockAllAttendance[dateString][emp.id] = {
                ...baseRecord,
                checkInTime: checkIn.toISOString(),
                checkOutTime: checkOut.toISOString(),
                status: 'Present',
            };
        } else {
             mockAllAttendance[dateString][emp.id] = {
                ...baseRecord,
                checkInTime: new Date(date).toISOString(),
                checkOutTime: null,
                status: 'Absent',
            };
        }
    }
});


const mockGoals: Goal[] = Array.from({ length: 15 }, (_, i) => ({
    id: `goal${i}`,
    companyId: 'comp1',
    employeeId: `emp${i}`,
    title: `Goal ${i}`,
    description: `Description for goal ${i}`,
    status: 'On Track',
    progress: (i % 10) * 10,
    dueDate: new Date().toISOString(),
}));

const mockCourses: TrainingCourse[] = [
    { id: 'course1', companyId: 'comp1', title: 'Sales Training', description: 'Sales', category: 'Sales', duration: 2, questions: [] },
    { id: 'course2', companyId: 'comp1', title: 'React Basics', description: 'React', category: 'Engineering', duration: 4, questions: [] },
    { id: 'course3', companyId: 'comp1', title: 'SEO Fundamentals', description: 'SEO', category: 'Marketing', duration: 3, questions: [] },
];

const mockEnrollments: Enrollment[] = Array.from({ length: 15 }, (_, i) => ({
    id: `enroll${i}`,
    companyId: 'comp1',
    employeeId: `emp${i}`,
    courseId: `course${(i % 3) + 1}`,
    enrollmentDate: new Date().toISOString(),
    status: 'Completed',
}));

const mockPayrollConfig = {
    employeeNapsaRate: 5,
    employerNapsaRate: 5,
    employeeNhimaRate: 1,
    employerNhimaRate: 1,
    taxRate: 25,
    overtimeMultiplier: 1.5,
    dailyTargetHours: 8,
    weeklyTargetHours: 40,
    monthlyTargetHours: 160,
    yearlyTargetHours: 1920,
    allowedIpAddress: '',
};

const mockProductivityScores = calculateProductivityScore(mockEmployees, mockDepartments, mockAllAttendance, mockReviews, mockGoals, mockPayrollConfig);


export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loadingHeroImages, setLoadingHeroImages] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const testimonialsQuery = query(ref(db, 'testimonials'), orderByChild('status'), equalTo('Approved'));
    const unsubscribeTestimonials = onValue(testimonialsQuery, (snapshot) => {
        const data = snapshot.val();
        setTestimonials(data ? Object.values(data) : []);
        setLoadingTestimonials(false);
    }, (error) => {
        console.error(error);
        setLoadingTestimonials(false);
    });

    const heroImagesRef = ref(db, 'platformSettings/heroImages');
    const unsubscribeHeroImages = onValue(heroImagesRef, (snapshot) => {
        const data = snapshot.val();
        setHeroImages(data ? Object.values(data) : []);
        setLoadingHeroImages(false);
    });
    
    const plansRef = ref(db, 'subscriptionPlans');
    const unsubscribePlans = onValue(plansRef, (snapshot) => {
        const data = snapshot.val();
        setPlans(data ? Object.values(data) : []);
        setLoadingPlans(false);
    });

    return () => {
        unsubscribeTestimonials();
        unsubscribeHeroImages();
        unsubscribePlans();
    };
  }, []);

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

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
                 <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">{link.label}</Link>
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
                            <SheetClose asChild><Link href="#features">Features</Link></SheetClose>
                             <SheetClose asChild><Link href="/careers">Jobs Centre</Link></SheetClose>
                             <SheetClose asChild><Link href="/who-we-serve">Who We Serve</Link></SheetClose>
                             <SheetClose asChild><Link href="/pricing">Pricing</Link></SheetClose>
                             <SheetClose asChild><Link href="/post-a-job">Post a Job</Link></SheetClose>
                            <SheetClose asChild><Link href="/login">Login</Link></SheetClose>
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
        
        <div className="relative my-16">
            {loadingHeroImages ? (
                 <div className="flex items-center justify-center h-[600px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Carousel
                    className="w-full"
                    opts={{ loop: true, }}
                    plugins={[ require('embla-carousel-autoplay')({ delay: 5000, stopOnInteraction: true }), ]}
                    >
                    <CarouselContent>
                        {heroImages.map((image) => (
                        <CarouselItem key={image.id}>
                            <Card className="overflow-hidden border-0 rounded-none">
                                <CardContent className="p-0">
                                    <Image
                                        src={image.imageUrl}
                                        alt={image.description}
                                        width={1600}
                                        height={800}
                                        className="w-full max-h-[600px] aspect-video object-cover"
                                        data-ai-hint={image.imageHint}
                                        priority
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                </Carousel>
            )}
        </div>

        {/* Charts Section */}
        <section className="py-20 md:py-28 bg-muted/50">
            <div className="container">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Powerful HR Analytics at Your Fingertips
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        Gain valuable insights into your workforce with our comprehensive reporting dashboard.
                    </p>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Employee Headcount</CardTitle></CardHeader>
                        <CardContent><HeadcountChart employees={mockEmployees} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Attendance Performance</CardTitle></CardHeader>
                        <CardContent><AttendancePerformanceChart allAttendance={mockAllAttendance} payrollConfig={mockPayrollConfig} view="month" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Turnover Rate</CardTitle></CardHeader>
                        <CardContent><TurnoverChart employees={mockEmployees} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Department Headcount</CardTitle></CardHeader>
                        <CardContent><DepartmentHeadcountChart employees={mockEmployees} departments={mockDepartments} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
                        <CardContent><DepartmentDistributionChart employees={mockEmployees} departments={mockDepartments} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Gender Distribution</CardTitle></CardHeader>
                        <CardContent><GenderDistributionChart employees={mockEmployees} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Active Contracts</CardTitle></CardHeader>
                        <CardContent><ActiveContractsChart employees={mockEmployees} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Employee Status</CardTitle></CardHeader>
                        <CardContent><EmployeeStatusChart employees={mockEmployees} leaveRequests={mockLeaveRequests} resignationRequests={mockResignationRequests} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Total Payroll Cost</CardTitle></CardHeader>
                        <CardContent><TotalPayrollChart payrollRuns={mockPayrollRuns} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Payroll Cost by Department</CardTitle></CardHeader>
                        <CardContent><PayrollByDepartmentChart employees={mockEmployees} departments={mockDepartments} payrollConfig={mockPayrollConfig} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Average Salary by Department</CardTitle></CardHeader>
                        <CardContent><AverageSalaryChart employees={mockEmployees} departments={mockDepartments} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Performance Rating Distribution</CardTitle></CardHeader>
                        <CardContent><PerformanceRatingChart reviews={mockReviews} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Average Productivity Score</CardTitle></CardHeader>
                        <CardContent><AverageProductivityChart scores={mockProductivityScores} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Top Performers Trend</CardTitle></CardHeader>
                        <CardContent><TopPerformersChart reviews={mockReviews} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Attendance Rate Trend</CardTitle></CardHeader>
                        <CardContent><AttendanceRateChart allAttendance={mockAllAttendance} employees={mockEmployees} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Leave Types Distribution</CardTitle></CardHeader>
                        <CardContent><LeaveTypesChart leaveRequests={mockLeaveRequests} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Top Departments by Absenteeism</CardTitle></CardHeader>
                        <CardContent><TopDepartmentsAbsenteeismChart allAttendance={mockAllAttendance} departments={mockDepartments} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Monthly Statutory Contributions</CardTitle></CardHeader>
                        <CardContent><MonthlyContributionsChart payrollRuns={mockPayrollRuns} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Contribution Breakdown</CardTitle></CardHeader>
                        <CardContent><ContributionBreakdownChart payrollRuns={mockPayrollRuns} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Employees Trained per Department</CardTitle></CardHeader>
                        <CardContent><EmployeesTrainedChart enrollments={mockEnrollments} employees={mockEmployees} departments={mockDepartments} /></CardContent>
                    </Card>
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Training vs. Performance Impact</CardTitle></CardHeader>
                            <CardContent><TrainingImpactChart enrollments={mockEnrollments} courses={mockCourses} reviews={mockReviews} /></CardContent>
                        </Card>
                        <Card className="flex flex-col items-center justify-center bg-primary/10">
                            <CardContent className="text-center">
                                <h3 className="text-2xl font-bold uppercase tracking-wider text-primary">
                                    Experience the Power of VerticalSync
                                </h3>
                            </CardContent>
                        </Card>
                    </div>
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
              {featuresList.map((feature, index) => (
                <Card key={index} className="bg-card">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-primary' })}
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
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28  bg-muted/50">
            <div className="container">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Find the Perfect Plan
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        Simple, transparent pricing that scales with your business.
                    </p>
                </div>
                {loadingPlans ? (
                     <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="flex flex-col bg-card">
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription>
                                        <span className="text-3xl font-bold">{currencyFormatter.format(plan.price)}</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="font-semibold">{plan.jobPostings} job postings included</p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardContent className="pt-0">
                                    <Button className="w-full" asChild>
                                        <Link href="/signup">Choose Plan</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container text-center">
            <Zap className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Simplify Your HR?
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
              Join dozens of companies streamlining their operations with VerticalSync. Get started today.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">Sign Up for Free</Link>
              </Button>
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
