// src/app/dashboard/reporting/components/gender-distribution-chart.tsx
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Employee } from '@/lib/data';

const chartConfig = {
  Male: { label: 'Male', color: 'hsl(var(--chart-1))' },
  Female: { label: 'Female', color: 'hsl(var(--chart-2))' },
  Other: { label: 'Other', color: 'hsl(var(--chart-3))' },
  'Not Specified': { label: 'Not Specified', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

interface GenderDistributionChartProps {
  employees: Employee[];
}

export default function GenderDistributionChart({ employees }: GenderDistributionChartProps) {
  const chartData = React.useMemo(() => {
    const genderCounts = employees.reduce(
      (acc, employee) => {
        const gender = employee.gender || 'Not Specified';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value,
      fill: `var(--color-${name})`,
    }));
  }, [employees]);

  if (employees.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
        No employee data available.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mt-2" />
      </PieChart>
    </ChartContainer>
  );
}
