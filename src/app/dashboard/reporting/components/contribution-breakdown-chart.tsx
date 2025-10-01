// src/app/dashboard/reporting/components/contribution-breakdown-chart.tsx
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
import type { PayrollRun } from '@/lib/data';

const chartConfig = {
  NAPSA: { label: 'NAPSA', color: 'hsl(var(--chart-1))' },
  NHIMA: { label: 'NHIMA', color: 'hsl(var(--chart-2))' },
  PAYE: { label: 'PAYE', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

interface ContributionBreakdownChartProps {
  payrollRuns: PayrollRun[];
}

export default function ContributionBreakdownChart({ payrollRuns }: ContributionBreakdownChartProps) {
  const chartData = React.useMemo(() => {
    const totals = {
        NAPSA: 0,
        NHIMA: 0,
        PAYE: 0,
    };

    payrollRuns.forEach(run => {
        Object.values(run.employees).forEach(emp => {
            totals.NAPSA += emp.employeeNapsaDeduction;
            totals.NHIMA += emp.employeeNhimaDeduction;
            totals.PAYE += emp.taxDeduction;
        })
    });
    
    return Object.entries(totals).map(([name, value]) => ({
        name,
        value,
        fill: chartConfig[name as keyof typeof chartConfig]?.color
    }));
  }, [payrollRuns]);

  if (chartData.every(d => d.value === 0)) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
        No contribution data available.
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
