// src/app/dashboard/reporting/components/top-performers-chart.tsx
'use client';

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { PerformanceReview } from '@/lib/data';
import { format, getQuarter, getYear } from 'date-fns';

const chartConfig = {
  count: {
    label: 'Top Performers',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface TopPerformersChartProps {
  reviews: PerformanceReview[];
}

export default function TopPerformersChart({ reviews }: TopPerformersChartProps) {
  const chartData = useMemo(() => {
    const quarterlyCounts = reviews.reduce((acc, review) => {
      // Consider only top performers (rating of 5)
      if (review.overallRating === 5) {
        const date = new Date(review.reviewDate);
        const year = getYear(date);
        const quarter = getQuarter(date);
        const key = `Q${quarter} ${year}`;
        
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(quarterlyCounts)
      .map(([quarter, count]) => ({
        quarter,
        count,
      }))
      .sort((a, b) => {
          const [aQ, aY] = a.quarter.split(' ');
          const [bQ, bY] = b.quarter.split(' ');
          if (aY !== bY) return parseInt(aY) - parseInt(bY);
          return parseInt(aQ.substring(1)) - parseInt(bQ.substring(1));
      });
  }, [reviews]);

  if (reviews.length === 0 || chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No performance data to display.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="quarter"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Line
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={{
            fill: "var(--color-count)",
          }}
          activeDot={{
            r: 6,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
