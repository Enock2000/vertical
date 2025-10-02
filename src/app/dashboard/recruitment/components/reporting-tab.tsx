// src/app/dashboard/recruitment/components/reporting-tab.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, JobVacancy, Department, Company } from '@/lib/data';
import { ApplicantStatus } from '@/lib/data';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Funnel, FunnelChart, LabelList, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { subMonths, format, differenceInDays, getMonth, getYear } from 'date-fns';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useAuth } from '@/app/auth-provider';

interface ReportingTabProps {
  applicants: Applicant[];
  vacancies: JobVacancy[];
  departments: Department[];
}

const requisitionChartConfig = {
  requisitions: {
    label: "Requisitions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: {
    label: "Candidates",
  },
  ...Object.fromEntries(
    Object.values(ApplicantStatus).map((status, index) => [
      status, { label: status, color: `hsl(var(--chart-${(index % 5) + 1}))` }
    ])
  )
} satisfies ChartConfig;

const timeToHireChartConfig = {
    days: {
        label: "Days",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export function ReportingTab({ applicants, vacancies, departments }: ReportingTabProps) {
  const { company } = useAuth();
  
  const costPerHireData = useMemo(() => {
    const subscriptionCost = company?.subscription.planId === 'pro' ? 200 : (company?.subscription.planId === 'enterprise' ? 500 : 50);
    return [{ category: "Subscription Plan", cost: subscriptionCost }];
  }, [company]);

  const requisitionsByDept = useMemo(() => {
    const counts: { [key: string]: number } = {};
    departments.forEach(dept => {
        counts[dept.name] = 0;
    });
    vacancies.filter(v => v.status === 'Open').forEach(vacancy => {
      if (counts[vacancy.departmentName] !== undefined) {
        counts[vacancy.departmentName]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, requisitions: count }));
  }, [vacancies, departments]);

  const candidatePipeline = useMemo(() => {
    const statusOrder = Object.values(ApplicantStatus);
    const counts: { [key in ApplicantStatus]: number } = { ...Object.fromEntries(statusOrder.map(s => [s, 0])) as any };
    
    applicants.forEach(applicant => {
        if(counts[applicant.status] !== undefined) {
             counts[applicant.status]++;
        }
    });
    
    return statusOrder.map((status, index) => ({
        value: counts[status],
        name: status,
        fill: `hsl(var(--chart-${index % 5 + 1}))`,
    })).filter(item => item.value > 0);

  }, [applicants]);
  
   const sourceOfHireData = useMemo(() => {
    const sourceCounts = applicants.reduce((acc, applicant) => {
        const source = applicant.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCounts).map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(var(--chart-${index % 5 + 1}))`
    }));
  }, [applicants]);

  const timeToHireData = useMemo(() => {
    const now = new Date();
    const monthLabels = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();

    return monthLabels.map(month => {
        const hiredThisMonth = applicants.filter(app =>
            app.status === 'Hired' &&
            app.hiredAt &&
            getMonth(new Date(app.hiredAt)) === getMonth(month) &&
            getYear(new Date(app.hiredAt)) === getYear(month)
        );

        if (hiredThisMonth.length === 0) {
            return { month: format(month, 'MMM'), days: 0 };
        }

        const totalDays = hiredThisMonth.reduce((sum, app) => {
            const appliedDate = new Date(app.appliedAt);
            const hiredDate = new Date(app.hiredAt!);
            return sum + differenceInDays(hiredDate, appliedDate);
        }, 0);

        return { month: format(month, 'MMM'), days: Math.round(totalDays / hiredThisMonth.length) };
    });
  }, [applicants]);


  const totalCost = costPerHireData.reduce((acc, item) => acc + item.cost, 0);
  const totalHires = applicants.filter(a => a.status === 'Hired').length;
  const costPerHire = totalHires > 0 ? totalCost / totalHires : 0;


  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Open Requisitions by Department</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={requisitionChartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={requisitionsByDept} layout="vertical">
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                width={80}
                            />
                            <XAxis dataKey="requisitions" type="number" hide />
                             <ChartTooltipContainer cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="requisitions" fill="var(--color-requisitions)" radius={4} layout="vertical">
                                 <LabelList dataKey="requisitions" position="right" offset={8} className="fill-foreground" />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Candidate Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={funnelChartConfig} className="mx-auto aspect-square min-h-[250px]">
                        <FunnelChart layout="vertical">
                             <Tooltip content={<ChartTooltipContent />} />
                            <Funnel
                                dataKey="value"
                                data={candidatePipeline}
                                nameKey="name"
                            >
                                <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
                            </Funnel>
                        </FunnelChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Source of Hire</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="mx-auto aspect-square min-h-[250px]">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent />} />
                             <Legend />
                            <Pie
                                data={sourceOfHireData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {sourceOfHireData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
         <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Average Time-to-Hire</CardTitle>
                    <CardDescription>Average number of days from application to hire.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={timeToHireChartConfig} className="h-[200px] w-full">
                        <LineChart accessibilityLayer data={timeToHireData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickFormatter={(value) => `${value} days`}
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Line
                                dataKey="days"
                                type="monotone"
                                stroke="var(--color-days)"
                                strokeWidth={2}
                                dot={true}
                            />
                        </LineChart>
                     </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Cost-per-Hire</CardTitle>
                     <CardDescription>Breakdown of recruitment costs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-muted-foreground">Average Cost Per Hire</p>
                        <p className="text-3xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(costPerHire)}
                        </p>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costPerHireData.map((item) => (
                                <TableRow key={item.category}>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(item.cost)}
                                </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
