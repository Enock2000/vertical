// src/app/dashboard/reporting/components/average-salary-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Employee, Department } from '@/lib/data';

const chartConfig = {
  averageSalary: {
    label: 'Average Salary',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

interface AverageSalaryChartProps {
  employees: Employee[];
  departments: Department[];
}

export default function AverageSalaryChart({ employees, departments }: AverageSalaryChartProps) {
  const chartData = useMemo(() => {
    return departments.map(dept => {
      const departmentEmployees = employees.filter(emp => emp.departmentId === dept.id && emp.status === 'Active');
      if (departmentEmployees.length === 0) {
        return { name: dept.name, averageSalary: 0 };
      }
      const totalSalary = departmentEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const averageSalary = totalSalary / departmentEmployees.length;
      return { name: dept.name, averageSalary };
    }).filter(item => item.averageSalary > 0);
  }, [employees, departments]);

  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
        notation: "compact",
        maximumFractionDigits: 0,
    }).format(value);
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No salary data to display.
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
        <XAxis dataKey="averageSalary" type="number" hide />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => currencyFormatter(value as number)}
            indicator="dot"
            />}
        />
        <Bar dataKey="averageSalary" fill="var(--color-averageSalary)" radius={4}>
           <LabelList
            dataKey="averageSalary"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={currencyFormatter}
            />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
