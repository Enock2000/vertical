// src/app/dashboard/organization/shifts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Pencil, Trash2, Clock, Sun, Moon, Sunset } from 'lucide-react';
import type { Shift } from '@/lib/data';

const WEEKDAYS = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

const SHIFT_TYPES = [
    { value: 'Morning', label: 'Morning Shift', icon: Sun },
    { value: 'Afternoon', label: 'Afternoon Shift', icon: Sunset },
    { value: 'Night', label: 'Night Shift', icon: Moon },
    { value: 'Flexible', label: 'Flexible', icon: Clock },
    { value: 'Custom', label: 'Custom', icon: Clock },
];

const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
];

interface ShiftFormProps {
    shift?: Shift | null;
    onClose: () => void;
}

function ShiftForm({ shift, onClose }: ShiftFormProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: shift?.name || '',
        type: shift?.type || 'Morning',
        startTime: shift?.startTime || '08:00',
        endTime: shift?.endTime || '17:00',
        color: shift?.color || '#3b82f6',
        graceMinutes: shift?.graceMinutes || 15,
        breakMinutes: shift?.breakMinutes || 60,
        overtimeEligible: shift?.overtimeEligible ?? true,
        weekdays: shift?.weekdays || [1, 2, 3, 4, 5],
        isActive: shift?.isActive ?? true,
    });

    const handleSubmit = async () => {
        if (!companyId || !formData.name) return;
        setIsLoading(true);
        try {
            if (shift) {
                await update(ref(db, `companies/${companyId}/shifts/${shift.id}`), formData);
                toast({ title: 'Shift Updated', description: `${formData.name} has been updated.` });
            } else {
                const shiftsRef = ref(db, `companies/${companyId}/shifts`);
                const newRef = push(shiftsRef);
                await set(newRef, { id: newRef.key, companyId, ...formData });
                toast({ title: 'Shift Created', description: `${formData.name} has been created.` });
            }
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save shift.' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleWeekday = (day: number) => {
        setFormData(prev => ({
            ...prev,
            weekdays: prev.weekdays.includes(day)
                ? prev.weekdays.filter(d => d !== day)
                : [...prev.weekdays, day].sort((a, b) => a - b)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Shift Name</Label>
                    <Input
                        placeholder="e.g., Morning Shift"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Shift Type</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as any })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SHIFT_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Grace Period (minutes)</Label>
                    <Input
                        type="number"
                        min={0}
                        max={60}
                        value={formData.graceMinutes}
                        onChange={e => setFormData({ ...formData, graceMinutes: parseInt(e.target.value) || 0 })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Break Duration (minutes)</Label>
                    <Input
                        type="number"
                        min={0}
                        max={120}
                        value={formData.breakMinutes}
                        onChange={e => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex gap-2">
                    {WEEKDAYS.map(day => (
                        <Button
                            key={day.value}
                            type="button"
                            variant={formData.weekdays.includes(day.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleWeekday(day.value)}
                        >
                            {day.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                    <Label>Overtime Eligible</Label>
                    <p className="text-xs text-muted-foreground">Allow overtime for this shift</p>
                </div>
                <Switch
                    checked={formData.overtimeEligible}
                    onCheckedChange={checked => setFormData({ ...formData, overtimeEligible: checked })}
                />
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isLoading || !formData.name}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {shift ? 'Update Shift' : 'Create Shift'}
                </Button>
            </DialogFooter>
        </div>
    );
}

export default function ShiftsPage() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    useEffect(() => {
        if (!companyId) return;
        const shiftsRef = ref(db, `companies/${companyId}/shifts`);
        const unsubscribe = onValue(shiftsRef, snapshot => {
            const data = snapshot.val();
            const list: Shift[] = data ? Object.values(data) : [];
            setShifts(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const handleDelete = async (shift: Shift) => {
        if (!companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/shifts/${shift.id}`));
            toast({ title: 'Shift Deleted', description: `${shift.name} has been deleted.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete shift.' });
        }
    };

    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingShift(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Shift Management
                    </CardTitle>
                    <CardDescription>
                        Create and manage work shifts with attendance rules.
                    </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingShift(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Shift
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
                            <DialogDescription>
                                Define shift times, grace periods, and working days.
                            </DialogDescription>
                        </DialogHeader>
                        <ShiftForm shift={editingShift} onClose={handleCloseDialog} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {shifts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shift</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Grace</TableHead>
                                <TableHead>Break</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shifts.map(shift => (
                                <TableRow key={shift.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }} />
                                            <span className="font-medium">{shift.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{shift.type}</Badge>
                                    </TableCell>
                                    <TableCell>{shift.graceMinutes || 15}m</TableCell>
                                    <TableCell>{shift.breakMinutes || 60}m</TableCell>
                                    <TableCell>
                                        <div className="flex gap-0.5">
                                            {WEEKDAYS.map(d => (
                                                <span
                                                    key={d.value}
                                                    className={`text-xs px-1 py-0.5 rounded ${shift.weekdays?.includes(d.value)
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted text-muted-foreground'
                                                        }`}
                                                >
                                                    {d.label[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={shift.isActive !== false ? 'default' : 'secondary'}>
                                            {shift.isActive !== false ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(shift)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No shifts defined yet.</p>
                        <p className="text-sm text-muted-foreground">Click "Add Shift" to create your first shift.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
