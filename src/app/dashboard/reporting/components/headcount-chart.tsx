"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Employee } from "@/lib/data"
import { useMemo } from "react"
import { format, subMonths, getMonth, getYear, startOfMonth } from "date-fns"


const chartConfig = {
  employees: {
    label: "Employees",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface HeadcountChartProps {
    employees: Employee[];
}

export default function HeadcountChart({ employees }: HeadcountChartProps) {
    const chartData = useMemo(() => {
        const now = new Date();
        const monthLabels = Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(now, i);
            return { month: format(date, "MMM"), monthIndex: getMonth(date), year: getYear(date) };
        }).reverse();

        const monthlyData = monthLabels.map(({ month, monthIndex, year }) => {
            const monthStart = startOfMonth(new Date(year, monthIndex));
            
            const activeEmployeesCount = employees.filter(employee => {
                const joinDate = new Date(employee.joinDate);
                // In a real app, you would also check for a separationDate here
                return employee.status === 'Active' && joinDate <= monthStart;
            }).length;

            return { month, employees: activeEmployeesCount };
        });
        
        return monthlyData;
    }, [employees]);


  if (employees.length === 0) {
    return <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="employees" fill="var(--color-employees)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
