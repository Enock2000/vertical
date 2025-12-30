// src/app/dashboard/performance/components/employee-performance-card.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Star, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee, Goal } from '@/lib/data';
import { AddGoalDialog } from './add-goal-dialog';
import { StartReviewDialog } from './start-review-dialog';
import { GoalItem } from './goal-item';

interface EmployeePerformanceCardProps {
  employee: Employee;
  goals: Goal[];
  companyId: string;
}

export function EmployeePerformanceCard({ employee, goals, companyId }: EmployeePerformanceCardProps) {
  const nameInitial = employee.name.split(' ').map(n => n[0]).join('');

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((acc, goal) => acc + goal.progress, 0);
    return totalProgress / goals.length;
  }, [goals]);

  // Calculate goal statistics
  const goalStats = useMemo(() => {
    const onTrack = goals.filter(g => g.status === 'On Track').length;
    const atRisk = goals.filter(g => g.status === 'At Risk').length;
    const completed = goals.filter(g => g.status === 'Completed').length;
    return { onTrack, atRisk, completed };
  }, [goals]);

  // Determine progress color
  const progressColor = useMemo(() => {
    if (overallProgress >= 75) return 'text-green-600';
    if (overallProgress >= 50) return 'text-blue-600';
    if (overallProgress >= 25) return 'text-orange-600';
    return 'text-red-600';
  }, [overallProgress]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {nameInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{employee.name}</CardTitle>
            <CardDescription className="truncate">{employee.role}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Overall Progress
            </h4>
            <span className={cn("text-lg font-bold", progressColor)}>
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Goal Status Summary */}
        {goals.length > 0 && (
          <div className="flex gap-2">
            {goalStats.onTrack > 0 && (
              <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                <TrendingUp className="h-3 w-3" />
                {goalStats.onTrack} On Track
              </Badge>
            )}
            {goalStats.atRisk > 0 && (
              <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100">
                <AlertTriangle className="h-3 w-3" />
                {goalStats.atRisk} At Risk
              </Badge>
            )}
            {goalStats.completed > 0 && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="h-3 w-3" />
                {goalStats.completed} Done
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Goals List */}
        <div>
          <h4 className="text-sm font-medium mb-2">Active Goals ({goals.length})</h4>
          <div className="space-y-2">
            {goals.length > 0 ? (
              goals.slice(0, 3).map(goal => <GoalItem key={goal.id} goal={goal} />)
            ) : (
              <p className="text-sm text-muted-foreground py-2">No goals set yet.</p>
            )}
            {goals.length > 3 && (
              <p className="text-xs text-muted-foreground">+ {goals.length - 3} more goals</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2 pt-4 border-t">
        <StartReviewDialog employee={employee} goals={goals} companyId={companyId}>
          <Button variant="outline" size="sm" className="flex-1">
            <Star className="mr-2 h-4 w-4" />
            Start Review
          </Button>
        </StartReviewDialog>
        <AddGoalDialog employee={employee} companyId={companyId}>
          <Button size="sm" className="flex-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </AddGoalDialog>
      </CardFooter>
    </Card>
  );
}
