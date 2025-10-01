// src/app/dashboard/reporting/components/training-hours-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Enrollment, TrainingCourse } from '@/lib/data';

interface TrainingHoursChartProps {
  enrollments: Enrollment[];
  courses: TrainingCourse[];
}

export default function TrainingHoursChart({ enrollments, courses }: TrainingHoursChartProps) {
  const chartData = useMemo(() => {
    const hoursByCategory: Record<string, number> = {};
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
    categories.forEach(cat => hoursByCategory[cat] = 0);

    const completedEnrollments = enrollments.filter(e => e.status === 'Completed');

    completedEnrollments.forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      if (course && course.category && course.duration) {
        hoursByCategory[course.category] += course.duration;
      }
    });

    return Object.keys(hoursByCategory).map(category => ({
      name: category,
      hours: hoursByCategory[category],
    }));
  }, [enrollments, courses]);
  
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      hours: { label: 'Hours' },
    };
    chartData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: `hsl(var(--chart-${(index % 5) + 1}))`,
        }
    });
    return config;
  }, [chartData]);


  if (chartData.every(d => d.hours === 0)) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No training hour data available.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="hours" stackId="a" fill="var(--color-hours)" />
      </BarChart>
    </ChartContainer>
  );
}
