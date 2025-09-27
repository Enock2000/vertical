"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Employee } from "@/lib/data"

const chartConfig = {
  employees: {
    label: "Employees",
  },
  male: {
    label: "Male",
    color: "hsl(var(--chart-1))",
  },
  female: {
    label: "Female",
    color: "hsl(var(--chart-2))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

interface DiversityChartProps {
    employees: Employee[];
}

export default function DiversityChart({ employees }: DiversityChartProps) {
  const chartData = React.useMemo(() => {
    // This is a placeholder for gender.
    // In a real app, you would have a 'gender' field on the employee object.
    const maleCount = Math.floor(employees.length * 0.6);
    const femaleCount = employees.length - maleCount;

    return [
      { gender: "male", count: maleCount, fill: "var(--color-male)" },
      { gender: "female", count: femaleCount, fill: "var(--color-female)" },
    ]
  }, [employees])

  const totalEmployees = React.useMemo(() => {
    return employees.length;
  }, [employees])

  if (employees.length === 0) {
    return <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="gender"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalEmployees.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Employees
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
