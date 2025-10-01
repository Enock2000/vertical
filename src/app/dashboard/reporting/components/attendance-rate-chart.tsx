
'use client';

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Employee, AttendanceRecord } from '@/lib/data';
import { format, subMonths, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const chartConfig = {
  attendanceRate: {
    label: 'Attendance Rate',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface AttendanceRateChartProps {
  allAttendance: Record<string, Record<string, AttendanceRecord>>;
  employees: Employee[];
}

export default function AttendanceRateChart({ allAttendance, employees }: AttendanceRateChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const monthLabels = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();

    return monthLabels.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const workDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(d => getDay(d) > 0 && getDay(d) < 6);
      
      const activeEmployeesDuringMonth = employees.filter(e => e.status === 'Active' && new Date(e.joinDate) <= monthEnd);
      
      const totalExpectedDays = activeEmployeesDuringMonth.length * workDays.length;
      
      let totalPresentDays = 0;
      workDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dailyRecords = allAttendance[dateStr] || {};
        activeEmployeesDuringMonth.forEach(emp => {
          if (dailyRecords[emp.id] && dailyRecords[emp.id].status !== 'Absent') {
            totalPresentDays++;
          }
        });
      });

      const attendanceRate = totalExpectedDays > 0 ? (totalPresentDays / totalExpectedDays) * 100 : 0;

      return {
        month: format(monthDate, 'MMM'),
        attendanceRate: Math.round(attendanceRate),
      };
    });
  }, [allAttendance, employees]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No attendance data to display.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          unit="%"
          domain={[0, 100]}
        />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Line
          dataKey="attendanceRate"
          type="monotone"
          stroke="var(--color-attendanceRate)"
          strokeWidth={2}
          dot={{
            fill: "var(--color-attendanceRate)",
          }}
          activeDot={{
            r: 6,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
