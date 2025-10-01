// src/app/dashboard/reporting/components/attendance-performance-chart.tsx
'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AttendanceRecord, PayrollConfig } from '@/lib/data';
import { format, subMonths, getMonth, getYear, differenceInHours } from 'date-fns';

const chartConfig = {
  onTime: {
    label: 'On Time',
    color: 'hsl(var(--chart-2))',
  },
  late: {
    label: 'Late',
    color: 'hsl(var(--chart-3))',
  },
  hoursMet: {
    label: 'Target Hours Met',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface AttendancePerformanceChartProps {
  allAttendance: Record<string, Record<string, AttendanceRecord>>;
  payrollConfig: PayrollConfig | null;
}

export default function AttendancePerformanceChart({ allAttendance, payrollConfig }: AttendancePerformanceChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const monthLabels = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();

    return monthLabels.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const recordsForMonth = Object.keys(allAttendance)
        .filter(date => date.startsWith(monthKey))
        .flatMap(date => Object.values(allAttendance[date]));

      const onTime = recordsForMonth.filter(r => r.status === 'Present').length;
      const late = recordsForMonth.filter(r => r.status === 'Late' || r.status === 'Early Out').length;
      
      const hoursMet = recordsForMonth.filter(r => {
          if (!r.checkInTime || !r.checkOutTime || !payrollConfig?.dailyTargetHours) return false;
          const hoursWorked = differenceInHours(new Date(r.checkOutTime), new Date(r.checkInTime));
          return hoursWorked >= payrollConfig.dailyTargetHours;
      }).length;
      
      return {
        month: format(monthDate, 'MMM'),
        onTime,
        late,
        hoursMet,
      };
    });
  }, [allAttendance, payrollConfig]);

  if (Object.keys(allAttendance).length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No attendance data available.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value}
        />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Area
          dataKey="hoursMet"
          type="natural"
          fill="var(--color-hoursMet)"
          fillOpacity={0.4}
          stroke="var(--color-hoursMet)"
          stackId="a"
        />
        <Area
          dataKey="onTime"
          type="natural"
          fill="var(--color-onTime)"
          fillOpacity={0.4}
          stroke="var(--color-onTime)"
          stackId="a"
        />
        <Area
          dataKey="late"
          type="natural"
          fill="var(--color-late)"
          fillOpacity={0.4}
          stroke="var(--color-late)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
