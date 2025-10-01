// src/app/dashboard/reporting/components/training-impact-chart.tsx
'use client';

import { useMemo } from 'react';
import { Scatter, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Enrollment, TrainingCourse, PerformanceReview } from '@/lib/data';

const chartConfig = {
  performance: {
    label: 'Performance Score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface TrainingImpactChartProps {
  enrollments: Enrollment[];
  courses: TrainingCourse[];
  reviews: PerformanceReview[];
}

export default function TrainingImpactChart({ enrollments, courses, reviews }: TrainingImpactChartProps) {
  const chartData = useMemo(() => {
    if (enrollments.length === 0 || courses.length === 0 || reviews.length === 0) {
      return [];
    }

    const employeeData: Record<string, { trainingHours: number; performance: number }> = {};

    reviews.forEach(review => {
      const employeeId = review.employeeId;
      if (!employeeData[employeeId] || new Date(review.reviewDate) > new Date(employeeData[employeeId].performance)) {
        employeeData[employeeId] = {
          ...employeeData[employeeId],
          performance: review.overallRating * 20, // Convert 1-5 scale to 0-100
        };
      }
    });

    enrollments.forEach(enrollment => {
      if (enrollment.status === 'Completed') {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (course?.duration) {
          if (!employeeData[enrollment.employeeId]) {
            employeeData[enrollment.employeeId] = { trainingHours: 0, performance: 0 };
          }
          employeeData[enrollment.employeeId].trainingHours = (employeeData[enrollment.employeeId].trainingHours || 0) + course.duration;
        }
      }
    });
    
    return Object.values(employeeData).filter(d => d.performance > 0 && d.trainingHours > 0);

  }, [enrollments, courses, reviews]);


  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
        No data to correlate training and performance.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="trainingHours" name="Training Hours" unit="h" />
        <YAxis type="number" dataKey="performance" name="Performance Score" unit="%" domain={[0, 100]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
        <Legend />
        <Scatter name="Employees" data={chartData} fill="var(--color-performance)" />
      </ScatterChart>
    </ChartContainer>
  );
}
