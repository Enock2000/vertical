// src/app/dashboard/performance/components/update-goal-progress-dialog.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, TrendingUp, AlertTriangle, CheckCircle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Goal } from '@/lib/data';

interface UpdateGoalProgressDialogProps {
    children: React.ReactNode;
    goal: Goal;
}

const statusConfig = {
    'On Track': { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    'At Risk': { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    'Completed': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    'Postponed': { icon: Pause, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function UpdateGoalProgressDialog({ children, goal }: UpdateGoalProgressDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(goal.progress);
    const [status, setStatus] = useState<Goal['status']>(goal.status);
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    async function handleSave() {
        setIsLoading(true);
        try {
            const goalRef = ref(db, `goals/${goal.id}`);

            await update(goalRef, {
                progress: progress,
                status: progress === 100 ? 'Completed' : status,
            });

            setOpen(false);
            toast({
                title: 'Goal Updated',
                description: `Progress updated to ${progress}%`,
            });

        } catch (error: any) {
            console.error("Error updating goal:", error);
            toast({
                variant: "destructive",
                title: "Failed to update goal",
                description: error.message || "An unexpected error occurred."
            });
        } finally {
            setIsLoading(false);
        }
    }

    const dueDate = new Date(goal.dueDate);
    const isOverdue = dueDate < new Date() && status !== 'Completed';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Update Goal Progress
                    </DialogTitle>
                    <DialogDescription>
                        Track progress and update the status of this goal.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Goal Info */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                        <div className={cn(
                            "text-xs",
                            isOverdue ? "text-red-600" : "text-muted-foreground"
                        )}>
                            Due: {format(dueDate, 'PPP')} {isOverdue && '(Overdue)'}
                        </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Progress</Label>
                            <span className="text-2xl font-bold text-primary">{progress}%</span>
                        </div>
                        <Slider
                            value={[progress]}
                            onValueChange={(value) => {
                                setProgress(value[0]);
                                if (value[0] === 100) {
                                    setStatus('Completed');
                                }
                            }}
                            max={100}
                            step={5}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Status Select */}
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as Goal['status'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={cn("h-4 w-4", config.color)} />
                                                {key}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this progress update..."
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Progress'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
