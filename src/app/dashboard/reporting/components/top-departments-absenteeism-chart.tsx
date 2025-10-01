
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AttendanceRecord, Department } from '@/lib/data';

const chartConfig = {
  absences: {
    label: 'Absences',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

interface TopDepartmentsAbsenteeismChartProps {
  allAttendance: Record<string, Record<string, AttendanceRecord>>;
  departments: Department[];
}

export default function TopDepartmentsAbsenteeismChart({ allAttendance, departments }: TopDepartmentsAbsenteeismChartProps) {
  const chartData = useMemo(() => {
    const departmentAbsences = departments.map(dept => {
      let absenceCount = 0;
      Object.values(allAttendance).forEach(dailyRecords => {
        Object.values(dailyRecords).forEach(record => {
          if (record.departmentName === dept.name && record.status === 'Absent') {
            absenceCount++;
          }
        });
      });
      return {
        name: dept.name,
        absences: absenceCount,
      };
    });

    return departmentAbsences
      .filter(dept => dept.absences > 0)
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 5); // Get top 5

  }, [allAttendance, departments]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No absenteeism data to display.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          width={80}
        />
        <XAxis dataKey="absences" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="absences" fill="var(--color-absences)" radius={4}>
           <LabelList
            dataKey="absences"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
