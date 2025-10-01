// src/app/dashboard/reporting/components/monthly-contributions-chart.tsx
'use client';

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { PayrollRun } from '@/lib/data';
import { format, parseISO, startOfMonth } from 'date-fns';

const chartConfig = {
  napsa: { label: 'NAPSA', color: 'hsl(var(--chart-1))' },
  nhima: { label: 'NHIMA', color: 'hsl(var(--chart-2))' },
  paye: { label: 'PAYE', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

interface MonthlyContributionsChartProps {
  payrollRuns: PayrollRun[];
}

export default function MonthlyContributionsChart({ payrollRuns }: MonthlyContributionsChartProps) {
  const chartData = useMemo(() => {
    const monthlyTotals = payrollRuns.reduce((acc, run) => {
      const month = format(startOfMonth(parseISO(run.runDate)), 'yyyy-MM');
      if (!acc[month]) {
          acc[month] = { napsa: 0, nhima: 0, paye: 0 };
      }
      Object.values(run.employees).forEach(emp => {
        acc[month].napsa += emp.employeeNapsaDeduction;
        acc[month].nhima += emp.employeeNhimaDeduction;
        acc[month].paye += emp.taxDeduction;
      });
      return acc;
    }, {} as Record<string, { napsa: number; nhima: number; paye: number; }>);

    return Object.entries(monthlyTotals)
      .map(([month, totals]) => ({
        month: format(new Date(month + '-02'), 'MMM yyyy'),
        ...totals,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [payrollRuns]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No contribution data to display.
      </div>
    );
  }
  
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
        notation: "compact",
    }).format(value);
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={currencyFormatter}
          width={80}
        />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => currencyFormatter(value as number)}
            indicator="dot"
            />}
        />
        <Legend />
        <Line dataKey="napsa" type="monotone" stroke="var(--color-napsa)" strokeWidth={2} dot={false} />
        <Line dataKey="nhima" type="monotone" stroke="var(--color-nhima)" strokeWidth={2} dot={false} />
        <Line dataKey="paye" type="monotone" stroke="var(--color-paye)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
