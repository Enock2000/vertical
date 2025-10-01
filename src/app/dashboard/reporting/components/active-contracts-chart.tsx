
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Employee } from '@/lib/data';

const chartConfig = {
  count: {
    label: 'Employees',
  },
  Permanent: {
    label: 'Permanent',
    color: 'hsl(var(--chart-1))',
  },
  'Fixed-Term': {
    label: 'Fixed-Term',
    color: 'hsl(var(--chart-2))',
  },
  Internship: {
    label: 'Internship',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

interface ActiveContractsChartProps {
  employees: Employee[];
}

export default function ActiveContractsChart({ employees }: ActiveContractsChartProps) {
  const chartData = useMemo(() => {
    const activeEmployees = employees.filter((emp) => emp.status === 'Active');
    const contractCounts = activeEmployees.reduce(
      (acc, employee) => {
        const type = employee.contractType || 'Permanent'; // Default to permanent if not specified
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.keys(chartConfig)
        .filter(key => key !== 'count' && contractCounts[key] > 0)
        .map((name) => ({
            name,
            count: contractCounts[name],
            fill: `var(--color-${name})`,
    }));
  }, [employees]);

  if (employees.length === 0 || chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No contract data to display.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="count" radius={4}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
