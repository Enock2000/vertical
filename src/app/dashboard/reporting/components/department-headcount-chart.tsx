"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Employee, Department } from "@/lib/data"
import { useMemo } from "react"

const chartConfig = {
  employees: {
    label: "Employees",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface DepartmentHeadcountChartProps {
    employees: Employee[];
    departments: Department[];
}

export default function DepartmentHeadcountChart({ employees, departments }: DepartmentHeadcountChartProps) {
    const chartData = useMemo(() => {
        if (departments.length === 0) return [];

        const departmentCounts = departments.map((dept) => {
            const count = employees.filter(emp => emp.departmentId === dept.id).length;
            return {
                name: dept.name,
                employees: count,
            }
        }).filter(dept => dept.employees > 0); // Only show departments with employees
        
        return departmentCounts;

    }, [employees, departments]);

    if (employees.length === 0 || departments.length === 0 || chartData.length === 0) {
        return <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">No data to display.</div>
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
                <XAxis dataKey="employees" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="employees" fill="var(--color-employees)" radius={4} layout="vertical">
                   <LabelList
                    dataKey="employees"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    )
}
