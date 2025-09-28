// src/app/dashboard/performance/components/employee-performance-card.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Star } from 'lucide-react';
import type { Employee, Goal } from '@/lib/data';
import { AddGoalDialog } from './add-goal-dialog';
import { GoalItem } from './goal-item';

interface EmployeePerformanceCardProps {
  employee: Employee;
  goals: Goal[];
}

export function EmployeePerformanceCard({ employee, goals }: EmployeePerformanceCardProps) {
  const nameInitial = employee.name.split(' ').map(n => n[0]).join('');

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((acc, goal) => acc + goal.progress, 0);
    return totalProgress / goals.length;
  }, [goals]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback>{nameInitial}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{employee.name}</CardTitle>
            <CardDescription>{employee.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium">Overall Progress</h4>
            <span className="text-sm font-semibold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} />
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium mb-2">Active Goals ({goals.length})</h4>
          <div className="space-y-2">
            {goals.length > 0 ? (
                goals.slice(0, 3).map(goal => <GoalItem key={goal.id} goal={goal} />)
            ) : (
                <p className="text-sm text-muted-foreground">No goals set yet.</p>
            )}
            {goals.length > 3 && (
                <p className="text-sm text-muted-foreground">+ {goals.length - 3} more</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
            <Star className="mr-2 h-4 w-4" />
            Start Review
        </Button>
         <AddGoalDialog employee={employee}>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Goal
            </Button>
        </AddGoalDialog>
      </CardFooter>
    </Card>
  );
}
