// src/app/dashboard/reporting/components/performance-rating-chart.tsx
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { PerformanceReview } from '@/lib/data';

const chartConfig = {
  Exceeds: {
    label: 'Exceeds',
    color: 'hsl(var(--chart-2))',
  },
  Meets: {
    label: 'Meets',
    color: 'hsl(var(--chart-1))',
  },
  'Needs Improvement': {
    label: 'Needs Improvement',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

interface PerformanceRatingChartProps {
  reviews: PerformanceReview[];
}

export default function PerformanceRatingChart({ reviews }: PerformanceRatingChartProps) {
  const chartData = React.useMemo(() => {
    const ratingCounts = {
      Exceeds: 0,
      Meets: 0,
      'Needs Improvement': 0,
    };

    reviews.forEach((review) => {
      if (review.overallRating >= 4) {
        ratingCounts.Exceeds++;
      } else if (review.overallRating === 3) {
        ratingCounts.Meets++;
      } else {
        ratingCounts['Needs Improvement']++;
      }
    });
    
    return Object.entries(ratingCounts).map(([name, value]) => ({
      name,
      value,
      fill: `var(--color-${name})`,
    })).filter(item => item.value > 0);
    
  }, [reviews]);

  if (reviews.length === 0 || chartData.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
        No performance rating data.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
            {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mt-2" />
      </PieChart>
    </ChartContainer>
  );
}
