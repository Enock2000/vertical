
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Goal } from '@/lib/data';
import { GoalItem } from '@/app/dashboard/performance/components/goal-item'; // Reusing the admin component
import { Target } from 'lucide-react';

interface PerformanceTabProps {
  goals: Goal[];
}

export function PerformanceTab({ goals }: PerformanceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Performance Goals</CardTitle>
        <CardDescription>
          Track your progress on the goals set by your manager.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
            <Target className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">You have no performance goals set.</p>
            <p className="text-sm text-muted-foreground">Your manager can add goals from their performance dashboard.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
