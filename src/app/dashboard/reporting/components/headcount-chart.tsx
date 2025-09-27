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
        const monthlyData: { [key: string]: number } = {
            "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0,
            "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0
        };

        employees.forEach(employee => {
            // This is a simplified version. A real implementation would use a join date.
            // For now, we'll just count all active employees for each month to show something.
            if(employee.status === 'Active') {
                Object.keys(monthlyData).forEach(month => {
                    monthlyData[month]++;
                });
            }
        });

        return Object.keys(monthlyData).map(month => ({ month, employees: monthlyData[month] }));
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
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="employees" fill="var(--color-employees)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
