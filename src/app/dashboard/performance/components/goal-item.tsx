// src/app/dashboard/performance/components/goal-item.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    ChevronsUpDown,
    CheckCircle2,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Pause,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/data';
import { format, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface GoalItemProps {
    goal: Goal;
}

const statusConfig = {
    'On Track': { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-200' },
    'At Risk': { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', borderColor: 'border-orange-200' },
    'Completed': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-200' },
    'Postponed': { icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100', borderColor: 'border-gray-200' },
};

export function GoalItem({ goal }: GoalItemProps) {
    const [progress, setProgress] = useState(goal.progress);
    const [status, setStatus] = useState(goal.status);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const config = statusConfig[goal.status];
    const StatusIcon = config.icon;
    const dueDate = new Date(goal.dueDate);
    const isOverdue = isPast(dueDate) && goal.status !== 'Completed';

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            const goalRef = ref(db, `goals/${goal.id}`);
            const newStatus = progress === 100 ? 'Completed' : status;
            await update(goalRef, { progress, status: newStatus });
            toast({
                title: 'Goal Updated',
                description: `Progress updated to ${progress}%`,
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update goal progress.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className={cn(
                "rounded-lg border p-3 transition-colors",
                config.borderColor,
                isOpen && config.bg
            )}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
                            <p className="text-sm font-medium truncate">{goal.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={goal.progress} className="h-1.5 flex-1" />
                            <span className="text-xs font-medium text-muted-foreground w-8">
                                {goal.progress}%
                            </span>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronsUpDown className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="space-y-4 pt-3 mt-3 border-t">
                    <p className="text-xs text-muted-foreground">{goal.description}</p>

                    {/* Due Date */}
                    <div className={cn(
                        "flex items-center gap-1 text-xs",
                        isOverdue ? "text-red-600" : "text-muted-foreground"
                    )}>
                        <Calendar className="h-3 w-3" />
                        Due: {format(dueDate, "MMM d, yyyy")}
                        {isOverdue && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Overdue</Badge>}
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium">Update Progress</label>
                            <span className="text-sm font-bold text-primary">{progress}%</span>
                        </div>
                        <Slider
                            value={[progress]}
                            onValueChange={(value) => {
                                setProgress(value[0]);
                                if (value[0] === 100) setStatus('Completed');
                            }}
                            max={100}
                            step={5}
                        />
                    </div>

                    {/* Status Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium">Status</label>
                        <Select value={status} onValueChange={(value) => setStatus(value as Goal['status'])}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="On Track">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-blue-600" />
                                        On Track
                                    </div>
                                </SelectItem>
                                <SelectItem value="At Risk">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                                        At Risk
                                    </div>
                                </SelectItem>
                                <SelectItem value="Completed">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        Completed
                                    </div>
                                </SelectItem>
                                <SelectItem value="Postponed">
                                    <div className="flex items-center gap-2">
                                        <Pause className="h-3 w-3 text-gray-600" />
                                        Postponed
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Update Button */}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                            <CheckCircle2 className="mr-2 h-3 w-3" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}
