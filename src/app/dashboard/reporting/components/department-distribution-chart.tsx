
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { Employee, Department } from "@/lib/data"

interface DepartmentDistributionChartProps {
    employees: Employee[];
    departments: Department[];
}

export default function DepartmentDistributionChart({ employees, departments }: DepartmentDistributionChartProps) {
  const chartData = React.useMemo(() => {
    if (departments.length === 0) return [];

    return departments.map((dept, index) => {
        const count = employees.filter(emp => emp.departmentId === dept.id).length;
        return {
            name: dept.name,
            value: count,
            fill: `hsl(var(--chart-${(index % 5) + 1}))`,
        }
    }).filter(dept => dept.value > 0); // Only show departments with employees

  }, [employees, departments])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    if (chartData.length > 0) {
        chartData.forEach((dept) => {
            config[dept.name] = {
                label: dept.name,
                color: dept.fill,
            }
        });
    }
    return config;
  }, [chartData]);


  if (employees.length === 0 || departments.length === 0 || chartData.length === 0) {
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
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
        >
             {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-mt-2"
        />
      </PieChart>
    </ChartContainer>
  )
}
