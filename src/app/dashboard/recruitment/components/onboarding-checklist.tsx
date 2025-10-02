// src/app/dashboard/recruitment/components/onboarding-checklist.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { db } from '@/lib/firebase';
import { ref, update, push } from 'firebase/database';
import type { Applicant, OnboardingTask } from '@/lib/data';
import { PlusCircle, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';


interface OnboardingChecklistProps {
  applicant: Applicant;
}

export function OnboardingChecklist({ applicant }: OnboardingChecklistProps) {
  const { companyId } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>(applicant.onboardingTasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleTaskChange = (taskId: string, completed: boolean) => {
    const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
    );
    setTasks(updatedTasks);
    update(ref(db, `companies/${companyId}/applicants/${applicant.id}/onboardingTasks`), updatedTasks);
  };
  
  const handleDateChange = (taskId: string, date: Date | undefined) => {
      const updatedTasks = tasks.map(task =>
          task.id === taskId ? { ...task, dueDate: date ? date.toISOString() : null } : task
      );
      setTasks(updatedTasks);
      update(ref(db, `companies/${companyId}/applicants/${applicant.id}/onboardingTasks`), updatedTasks);
  }

  const handleAddTask = () => {
    if (newTaskTitle.trim() === '' || !companyId) return;
    const newTask: OnboardingTask = {
      id: push(ref(db)).key!,
      title: newTaskTitle.trim(),
      completed: false,
      dueDate: null,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    update(ref(db, `companies/${companyId}/applicants/${applicant.id}/onboardingTasks`), updatedTasks);
    setNewTaskTitle('');
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{applicant.name}'s Onboarding</CardTitle>
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                                "w-[150px] justify-start text-left font-normal",
                                !task.dueDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {task.dueDate ? format(parseISO(task.dueDate), "MMM d, yyyy") : <span>Set due date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={task.dueDate ? parseISO(task.dueDate) : undefined}
                            onSelect={(date) => handleDateChange(task.id, date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
           <div className="flex items-center gap-2">
                <Input
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask} size="icon">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
