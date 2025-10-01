// src/app/dashboard/reporting/components/employees-trained-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Enrollment, Employee, Department } from '@/lib/data';

const chartConfig = {
  trained: {
    label: 'Trained Employees',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface EmployeesTrainedChartProps {
  enrollments: Enrollment[];
  employees: Employee[];
  departments: Department[];
}

export default function EmployeesTrainedChart({ enrollments, employees, departments }: EmployeesTrainedChartProps) {
  const chartData = useMemo(() => {
    if (departments.length === 0 || enrollments.length === 0) return [];
    
    const completedEnrollments = enrollments.filter(e => e.status === 'Completed');
    
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
      const trainedEmployeeIds = new Set(
        completedEnrollments
          .filter(enr => deptEmployees.some(emp => emp.id === enr.employeeId))
          .map(enr => enr.employeeId)
      );
      return {
        name: dept.name,
        trained: trainedEmployeeIds.size,
      };
    }).filter(d => d.trained > 0);

  }, [enrollments, employees, departments]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No training data available.
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
        <XAxis dataKey="trained" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="trained" fill="var(--color-trained)" radius={4}>
           <LabelList
            dataKey="trained"
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
