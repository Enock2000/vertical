// src/app/dashboard/recruitment/components/onboarding-tab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { defaultOnboardingTasks } from '@/lib/data';
import type { OnboardingTask } from '@/lib/data';

export function OnboardingTab() {
  const [tasks, setTasks] = useState<OnboardingTask[]>(
    defaultOnboardingTasks.map(task => ({ ...task, completed: false }))
  );

  const handleTaskChange = (taskId: string, completed: boolean) => {
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, completed } : task)));
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Checklist</CardTitle>
        <CardDescription>
          Track the new hire's progress through the onboarding process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="flex-shrink-0">Progress</Label>
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground">{completedTasks} / {totalTasks} completed</span>
          </div>
          <div className="space-y-2 rounded-md border p-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={(checked) => handleTaskChange(task.id, !!checked)}
                />
                <Label
                  htmlFor={task.id}
                  className={`flex-1 ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                >
                  {task.title}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
