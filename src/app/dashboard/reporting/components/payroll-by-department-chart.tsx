// src/app/dashboard/reporting/components/payroll-by-department-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Employee, Department, PayrollConfig } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';

const chartConfig = {
  payroll: {
    label: 'Payroll Cost',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface PayrollByDepartmentChartProps {
  employees: Employee[];
  departments: Department[];
  payrollConfig: PayrollConfig | null;
}

export default function PayrollByDepartmentChart({ employees, departments, payrollConfig }: PayrollByDepartmentChartProps) {
  const chartData = useMemo(() => {
    if (!payrollConfig || departments.length === 0) {
      return [];
    }

    return departments.map(dept => {
      const departmentEmployees = employees.filter(emp => emp.departmentId === dept.id && emp.status === 'Active');
      const totalPayroll = departmentEmployees.reduce((sum, emp) => {
        const details = calculatePayroll(emp, payrollConfig);
        return sum + details.netPay;
      }, 0);

      return {
        name: dept.name,
        payroll: totalPayroll,
      };
    }).filter(item => item.payroll > 0); // Only show departments with payroll costs

  }, [employees, departments, payrollConfig]);
  
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
        notation: "compact",
    }).format(value);
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No payroll data to display.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickFormatter={currencyFormatter} width={80} />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => currencyFormatter(value as number)}
            indicator="dot"
            />}
        />
        <Bar dataKey="payroll" fill="var(--color-payroll)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
