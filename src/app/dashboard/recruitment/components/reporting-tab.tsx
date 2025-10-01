// src/app/dashboard/recruitment/components/reporting-tab.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, JobVacancy, Department } from '@/lib/data';
import { ApplicantStatus } from '@/lib/data';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Funnel, FunnelChart, LabelList, Tooltip, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

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


export function ReportingTab({ applicants, vacancies, departments }: ReportingTabProps) {
  
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
    
    return statusOrder.map(status => ({
        value: counts[status],
        name: status,
        fill: `var(--color-${status})`,
    })).filter(item => item.value > 0);

  }, [applicants]);


  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Open Requisitions by Department</CardTitle>
                    <CardDescription>Number of open job positions in each department.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={requisitionChartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={requisitionsByDept}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis allowDecimals={false} />
                             <ChartTooltipContainer content={<ChartTooltipContent />} />
                            <Bar dataKey="requisitions" fill="var(--color-requisitions)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Candidate Pipeline</CardTitle>
                    <CardDescription>Distribution of candidates across all hiring stages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={funnelChartConfig} className="mx-auto aspect-square min-h-[250px]">
                        <FunnelChart layout="vertical">
                             <Tooltip />
                            <Legend />
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
        </div>
    </div>
  );
}
