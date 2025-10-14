
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
  PieChart,
  Wallet,
  CalendarCheck,
  Award,
  BookOpen,
  DollarSign,
  Menu,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, Funnel, FunnelChart, LabelList, Pie as RechartsPie, Cell } from 'recharts';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '/careers', label: 'Jobs Centre' },
  { href: '/post-a-job', label: 'Post a Job' },
];

const totalPayrollChartConfig = {
  total: { label: 'Total Payroll', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;
const totalPayrollData = [
    { month: 'Jan', total: 186000 },
    { month: 'Feb', total: 305000 },
    { month: 'Mar', total: 237000 },
    { month: 'Apr', total: 173000 },
    { month: 'May', total: 209000 },
    { month: 'Jun', total: 214000 },
];

const turnoverChartConfig = {
  hires: { label: 'Hires', color: 'hsl(var(--chart-2))' },
  separations: { label: 'Separations', color: 'hsl(var(--destructive))' },
} satisfies ChartConfig;
const turnoverData = [
    { month: "Jan", hires: 10, separations: 2 },
    { month: "Feb", hires: 12, separations: 3 },
    { month: "Mar", hires: 5, separations: 1 },
    { month: "Apr", hires: 15, separations: 4 },
    { month: "May", hires: 8, separations: 2 },
    { month: "Jun", hires: 11, separations: 1 },
];

const headcountChartConfig = {
    employees: { label: "Employees", color: "hsl(var(--primary))" },
} satisfies ChartConfig;
const headcountData = [
    { month: "Jan", employees: 50 },
    { month: "Feb", employees: 55 },
    { month: "Mar", employees: 58 },
    { month: "Apr", employees: 62 },
    { month: "May", employees: 65 },
    { month: "Jun", employees: 70 },
];

const genderDistributionChartConfig = {
  Male: { label: 'Male', color: 'hsl(var(--chart-1))' },
  Female: { label: 'Female', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const genderDistributionData = [
    { name: 'Male', value: 40, fill: 'var(--color-Male)' },
    { name: 'Female', value: 30, fill: 'var(--color-Female)' },
];

const candidatePipelineChartConfig = {
  value: { label: "Candidates" },
  New: { label: 'New', color: `hsl(var(--chart-1))` },
  Screening: { label: 'Screening', color: `hsl(var(--chart-2))` },
  Interview: { label: 'Interview', color: `hsl(var(--chart-3))` },
  Offer: { label: 'Offer', color: `hsl(var(--chart-4))` },
  Hired: { label: 'Hired', color: `hsl(var(--chart-5))` },
} satisfies ChartConfig;
const candidatePipelineData = [
    { value: 120, name: 'New', fill: candidatePipelineChartConfig.New.color },
    { value: 80, name: 'Screening', fill: candidatePipelineChartConfig.Screening.color },
    { value: 45, name: 'Interview', fill: candidatePipelineChartConfig.Interview.color },
    { value: 20, name: 'Offer', fill: candidatePipelineChartConfig.Offer.color },
    { value: 11, name: 'Hired', fill: candidatePipelineChartConfig.Hired.color },
];

const productivityChartConfig = {
  average: { label: 'Avg Score', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const productivityData = [
  { department: 'Sales', average: 82 },
  { department: 'Engineering', average: 95 },
  { department: 'Marketing', average: 78 },
  { department: 'Support', average: 88 },
  { department: 'HR', average: 91 },
];

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
                <Link href="/login">Admin Login</Link>
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
                                <Link href="/careers">Jobs Centre</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/post-a-job">Post a Job</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/login">Admin Login</Link>
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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Headcount */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Employee Headcount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={headcountChartConfig} className="min-h-[200px] w-full">
                                <BarChart accessibilityLayer data={headcountData}>
                                    <CartesianGrid vertical={false} />
                                    <Bar dataKey="employees" fill="var(--color-employees)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Turnover */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Turnover Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={turnoverChartConfig} className="min-h-[200px] w-full">
                                <AreaChart accessibilityLayer data={turnoverData}>
                                    <CartesianGrid vertical={false} />
                                    <Area dataKey="hires" type="natural" fill="var(--color-hires)" fillOpacity={0.4} stroke="var(--color-hires)" stackId="a" />
                                    <Area dataKey="separations" type="natural" fill="var(--color-separations)" fillOpacity={0.4} stroke="var(--color-separations)" stackId="a" />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                     {/* Payroll Trend */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Total Payroll Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={totalPayrollChartConfig} className="min-h-[200px] w-full">
                                <LineChart accessibilityLayer data={totalPayrollData}>
                                    <CartesianGrid vertical={false} />
                                    <Line dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Gender Distribution */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Gender Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={genderDistributionChartConfig} className="mx-auto aspect-square max-h-[200px]">
                                <RechartsPie data={genderDistributionData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {genderDistributionData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </RechartsPie>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    
                    {/* Candidate Pipeline */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Candidate Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={candidatePipelineChartConfig} className="mx-auto aspect-video min-h-[200px]">
                                <FunnelChart layout="vertical">
                                    <Funnel dataKey="value" data={candidatePipelineData} nameKey="name">
                                        <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
                                    </Funnel>
                                </FunnelChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                     {/* Productivity Score */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Department Productivity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={productivityChartConfig} className="mx-auto aspect-square max-h-[200px]">
                                <RadarChart data={productivityData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="department" />
                                    <Radar dataKey="average" fill="var(--color-average)" fillOpacity={0.6} dot={{r: 4, fillOpacity: 1}} />
                                </RadarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
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
