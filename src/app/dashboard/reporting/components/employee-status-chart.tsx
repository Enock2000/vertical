// src/app/dashboard/reporting/components/employee-status-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Employee, LeaveRequest, ResignationRequest } from '@/lib/data';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const chartConfig = {
  count: {
    label: 'Employees',
  },
  'On Leave': {
    label: 'On Leave',
    color: 'hsl(var(--chart-2))',
  },
  'Sick': {
    label: 'Sick',
    color: 'hsl(var(--chart-3))',
  },
  'Resigned': {
    label: 'Resigned',
    color: 'hsl(var(--chart-5))',
  },
  'Terminated': {
    label: 'Terminated',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

interface EmployeeStatusChartProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  resignationRequests: ResignationRequest[];
}

export default function EmployeeStatusChart({ employees, leaveRequests, resignationRequests }: EmployeeStatusChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const onLeaveCount = leaveRequests.filter(req => 
        req.status === 'Approved' && 
        req.leaveType === 'Annual' &&
        isWithinInterval(today, { start: new Date(req.startDate), end: new Date(req.endDate) })
    ).length;

    const onSickLeaveCount = leaveRequests.filter(req => 
        req.status === 'Approved' && 
        req.leaveType === 'Sick' &&
        isWithinInterval(today, { start: new Date(req.startDate), end: new Date(req.endDate) })
    ).length;

    const sickEmployeesCount = employees.filter(emp => emp.status === 'Sick').length;

    const resignedCount = resignationRequests.filter(
      req => req.status === 'Approved'
    ).length;
    
    const terminatedCount = employees.filter(emp => emp.status === 'Inactive' && emp.terminationDate).length;

    const data = [
      { name: 'On Leave', count: onLeaveCount, fill: 'var(--color-On Leave)' },
      { name: 'Sick', count: onSickLeaveCount + sickEmployeesCount, fill: 'var(--color-Sick)' },
      { name: 'Resigned', count: resignedCount, fill: 'var(--color-Resigned)' },
      { name: 'Terminated', count: terminatedCount, fill: 'var(--color-Terminated)' },
    ];
    
    return data;
  }, [employees, leaveRequests, resignationRequests]);

  if (chartData.every(d => d.count === 0)) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No employees on leave, sick, or resigned.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} layout="vertical">
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="capitalize"
        />
        <XAxis dataKey="count" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="count" radius={4}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
