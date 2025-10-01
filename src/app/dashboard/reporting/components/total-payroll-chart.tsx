// src/app/dashboard/reporting/components/total-payroll-chart.tsx
'use client';

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { PayrollRun } from '@/lib/data';
import { format, parseISO, startOfMonth } from 'date-fns';

const chartConfig = {
  total: {
    label: 'Total Payroll',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface TotalPayrollChartProps {
  payrollRuns: PayrollRun[];
}

export default function TotalPayrollChart({ payrollRuns }: TotalPayrollChartProps) {
  const chartData = useMemo(() => {
    const monthlyTotals = payrollRuns.reduce((acc, run) => {
      const month = format(startOfMonth(parseISO(run.runDate)), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + run.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        month: format(new Date(month + '-02'), 'MMM yyyy'), // Use day 2 to avoid timezone issues
        total,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [payrollRuns]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No payroll history to display.
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
      <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
        <Line
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={{
            fill: "var(--color-total)",
          }}
          activeDot={{
            r: 6,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
