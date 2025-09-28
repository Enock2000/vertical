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
import { ChevronsUpDown, CheckCircle2 } from 'lucide-react';
import type { Goal } from '@/lib/data';
import { format } from 'date-fns';

interface GoalItemProps {
  goal: Goal;
}

export function GoalItem({ goal }: GoalItemProps) {
    const [progress, setProgress] = useState(goal.progress);
    const [status, setStatus] = useState(goal.status);

    const handleUpdate = () => {
        const goalRef = ref(db, `goals/${goal.id}`);
        update(goalRef, { progress, status });
    };

    return (
        <Collapsible>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate pr-2">{goal.title}</p>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4 py-2">
                 <p className="text-xs text-muted-foreground">{goal.description}</p>
                 <div className="space-y-2">
                    <label className="text-xs font-medium">Progress: {progress}%</label>
                    <Slider 
                        value={[progress]}
                        onValueChange={(value) => setProgress(value[0])}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-medium">Status</label>
                    <Select value={status} onValueChange={(value) => setStatus(value as Goal['status'])}>
                        <SelectTrigger>
                            <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="On Track">On Track</SelectItem>
                            <SelectItem value="At Risk">At Risk</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Postponed">Postponed</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Due: {format(new Date(goal.dueDate), "MMM d, yyyy")}</p>
                    <Button size="sm" variant="outline" onClick={handleUpdate}>
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Update
                    </Button>
                 </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
