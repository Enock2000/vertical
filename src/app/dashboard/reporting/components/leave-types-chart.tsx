
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
import type { LeaveRequest } from '@/lib/data';

const chartConfig = {
  Annual: { label: 'Annual', color: 'hsl(var(--chart-1))' },
  Sick: { label: 'Sick', color: 'hsl(var(--chart-2))' },
  Unpaid: { label: 'Unpaid', color: 'hsl(var(--chart-3))' },
  Maternity: { label: 'Maternity', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

interface LeaveTypesChartProps {
  leaveRequests: LeaveRequest[];
}

export default function LeaveTypesChart({ leaveRequests }: LeaveTypesChartProps) {
  const chartData = React.useMemo(() => {
    const typeCounts = leaveRequests
      .filter(req => req.status === 'Approved')
      .reduce((acc, req) => {
        acc[req.leaveType] = (acc[req.leaveType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      fill: chartConfig[name as keyof typeof chartConfig]?.color || 'hsl(var(--chart-5))',
    }));
  }, [leaveRequests]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
        No approved leave data.
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
