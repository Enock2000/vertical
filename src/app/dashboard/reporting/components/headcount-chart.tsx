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
        // Generate labels for the last 12 months
        const monthLabels = Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(now, i);
            return { month: format(date, "MMM"), dateObj: startOfMonth(date) };
        }).reverse();

        // Calculate headcount for each month
        const monthlyData = monthLabels.map(({ month, dateObj }) => {
            const headcount = employees.filter(employee => {
                if (!employee.joinDate) return false;
                const joinDate = new Date(employee.joinDate);
                // In a real app, you would also check for a separationDate here.
                // For now, we'll count any employee who joined before the end of that month.
                return joinDate <= dateObj;
            }).length;

            return { month, employees: headcount };
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
