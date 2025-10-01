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

    const departmentCounts = departments.map((dept, index) => {
        const count = employees.filter(emp => emp.departmentId === dept.id).length;
        return {
            name: dept.name,
            value: count,
            fill: `var(--color-chart-${(index % 5) + 1})`,
        }
    }).filter(dept => dept.value > 0); // Only show departments with employees
    
    return departmentCounts;

  }, [employees, departments])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    departments.forEach((dept, index) => {
        config[dept.name] = {
            label: dept.name,
            color: `hsl(var(--chart-${(index % 5) + 1}))`,
        }
    });
    return config;
  }, [departments]);


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
          content={<ChartTooltipContent nameKey="value" hideLabel />}
        />
        <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={60}
        >
             {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}
