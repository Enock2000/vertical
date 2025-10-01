// src/app/dashboard/reporting/components/average-productivity-chart.tsx
'use client';

import * as React from 'react';
import { PolarGrid, Radar, RadarChart, PolarAngleAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DepartmentProductivityScore } from '@/lib/data';

const chartConfig = {
  average: {
    label: 'Avg Score',
    color: 'hsl(var(--chart-1))',
  },
  attendance: {
    label: 'Attendance',
    color: 'hsl(var(--chart-2))',
  },
  hours: {
    label: 'Target Hours',
    color: 'hsl(var(--chart-3))',
  },
  performance: {
    label: 'Performance',
    color: 'hsl(var(--chart-4))',
  },
  goals: {
    label: 'Goals',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

interface AverageProductivityChartProps {
  scores: DepartmentProductivityScore[];
}

export default function AverageProductivityChart({ scores }: AverageProductivityChartProps) {
  const chartData = React.useMemo(() => {
    return scores.map(score => ({
      department: score.department,
      average: score.average,
      ...score.scores,
    }));
  }, [scores]);
  
  if (!chartData || chartData.length === 0) {
     return (
        <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground text-center p-4">
        <div>
            <p className="font-semibold">Not Enough Data</p>
            <p className="text-sm">Productivity scores require data from attendance, reviews, and goals.</p>
        </div>
        </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <RadarChart data={chartData}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <PolarAngleAxis dataKey="department" />
        <PolarGrid />
        <Radar
          dataKey="average"
          fill="var(--color-average)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  );
}
