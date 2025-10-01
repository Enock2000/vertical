// src/app/dashboard/reporting/components/average-productivity-chart.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';

const chartConfig = {
  score: {
    label: 'Productivity Score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

// This is a placeholder component.
// A real implementation would require a clear definition of "Productivity Score"
// and logic to calculate it based on attendance, performance reviews, goal completion, etc.
export default function AverageProductivityChart() {
    
  return (
    <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground text-center p-4">
      <div>
        <p className="font-semibold">Coming Soon</p>
        <p className="text-sm">A radar chart showing productivity scores will be available in a future update.</p>
      </div>
    </div>
  );
}
