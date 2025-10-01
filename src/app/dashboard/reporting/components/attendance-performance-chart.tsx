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
import { format, subMonths, differenceInHours, startOfWeek, startOfDay, subWeeks, subDays } from 'date-fns';

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
  view: 'day' | 'week' | 'month';
}

export default function AttendancePerformanceChart({ allAttendance, payrollConfig, view }: AttendancePerformanceChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    let timeLabels;
    let formatLabel;
    let getKey;

    switch (view) {
        case 'day':
            timeLabels = Array.from({ length: 7 }, (_, i) => subDays(now, i)).reverse();
            formatLabel = (date: Date) => format(date, 'EEE');
            getKey = (date: Date) => format(date, 'yyyy-MM-dd');
            break;
        case 'week':
            timeLabels = Array.from({ length: 8 }, (_, i) => subWeeks(now, i)).reverse();
            formatLabel = (date: Date) => `W${format(date, 'w')}`;
            getKey = (date: Date) => format(startOfWeek(date), 'yyyy-MM-dd');
            break;
        default: // month
            timeLabels = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();
            formatLabel = (date: Date) => format(date, 'MMM');
            getKey = (date: Date) => format(date, 'yyyy-MM');
            break;
    }


    const groupedData = Object.keys(allAttendance).reduce((acc, date) => {
      const records = Object.values(allAttendance[date]);
      const dateObj = new Date(date);
      let key;
      if (view === 'day') {
        key = getKey(startOfDay(dateObj));
      } else if (view === 'week') {
        key = getKey(startOfWeek(dateObj));
      } else {
        key = date.substring(0, 7); // YYYY-MM
      }

      if (!acc[key]) {
        acc[key] = { onTime: 0, late: 0, hoursMet: 0 };
      }
      records.forEach(r => {
        if (r.status === 'Present') acc[key].onTime++;
        if (r.status === 'Late' || r.status === 'Early Out') acc[key].late++;
        if (r.checkInTime && r.checkOutTime && payrollConfig?.dailyTargetHours) {
          if (differenceInHours(new Date(r.checkOutTime), new Date(r.checkInTime)) >= payrollConfig.dailyTargetHours) {
            acc[key].hoursMet++;
          }
        }
      });

      return acc;
    }, {} as Record<string, { onTime: number; late: number; hoursMet: number }>);


    return timeLabels.map(date => {
      const key = getKey(date);
      return {
        label: formatLabel(date),
        ... (groupedData[key] || { onTime: 0, late: 0, hoursMet: 0 }),
      };
    });

  }, [allAttendance, payrollConfig, view]);

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
          dataKey="label"
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
