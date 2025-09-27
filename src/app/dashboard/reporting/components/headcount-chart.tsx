"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", employees: 186 },
  { month: "February", employees: 305 },
  { month: "March", employees: 237 },
  { month: "April", employees: 173 },
  { month: "May", employees: 209 },
  { month: "June", employees: 214 },
]

const chartConfig = {
  employees: {
    label: "Employees",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function HeadcountChart() {
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
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="employees" fill="var(--color-employees)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
