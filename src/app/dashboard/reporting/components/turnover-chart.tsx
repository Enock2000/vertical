"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Employee } from "@/lib/data"
import { useMemo } from "react"
import { format, subMonths, getMonth, getYear } from "date-fns"


const chartConfig = {
  hires: {
    label: "Hires",
    color: "hsl(var(--chart-2))",
  },
  separations: {
    label: "Separations",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

interface TurnoverChartProps {
    employees: Employee[];
}

export default function TurnoverChart({ employees }: TurnoverChartProps) {
    const chartData = useMemo(() => {
        const now = new Date();
        const monthLabels = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(now, i);
            return { month: format(date, "MMM"), monthIndex: getMonth(date), year: getYear(date) };
        }).reverse();
        
        return monthLabels.map(({ month, monthIndex, year }) => {
            const hires = employees.filter(employee => {
                const joinDate = new Date(employee.joinDate);
                return getMonth(joinDate) === monthIndex && getYear(joinDate) === year;
            }).length;

            // Placeholder for separations
            const separations = Math.floor(Math.random() * 2);

            return { month, hires, separations };
        })
    }, [employees]);
    
    if (employees.length === 0) {
        return <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">No data to display.</div>
    }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillHires" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-hires)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-hires)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillSeparations" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-separations)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-separations)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="hires"
          type="natural"
          fill="url(#fillHires)"
          fillOpacity={0.4}
          stroke="var(--color-hires)"
          stackId="a"
        />
        <Area
          dataKey="separations"
          type="natural"
          fill="url(#fillSeparations)"
          fillOpacity={0.4}
          stroke="var(--color-separations)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
