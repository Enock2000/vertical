"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  { month: "January", hires: 5, separations: 2 },
  { month: "February", hires: 6, separations: 3 },
  { month: "March", hires: 4, separations: 2 },
  { month: "April", hires: 7, separations: 4 },
  { month: "May", hires: 5, separations: 1 },
  { month: "June", hires: 8, separations: 3 },
]

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

export default function TurnoverChart() {
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
          tickFormatter={(value) => value.slice(0, 3)}
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
