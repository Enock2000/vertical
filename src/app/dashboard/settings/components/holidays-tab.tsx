'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Loader2, CalendarDays, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Holiday } from '@/lib/data';
import { format, parseISO } from 'date-fns';

export function HolidaysTab() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [recurring, setRecurring] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        const holidaysRef = ref(db, `companies/${companyId}/holidays`);
        const unsubscribe = onValue(holidaysRef, (snapshot) => {
            const data = snapshot.val();
            const list: Holiday[] = data
                ? Object.keys(data).map(key => ({ ...data[key], id: key }))
                : [];
            list.sort((a, b) => a.date.localeCompare(b.date));
            setHolidays(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const handleAdd = async () => {
        if (!companyId || !name.trim() || !date) return;
        setSaving(true);
        try {
            const holidaysRef = ref(db, `companies/${companyId}/holidays`);
            const newRef = push(holidaysRef);
            const newHoliday: Holiday = {
                id: newRef.key!,
                companyId,
                name: name.trim(),
                date,
                recurring,
            };
            await set(newRef, newHoliday);
            toast({ title: 'Holiday Added', description: `"${name.trim()}" has been added.` });
            setName('');
            setDate('');
            setRecurring(false);
            setDialogOpen(false);
        } catch (error) {
            console.error('Error adding holiday:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add holiday.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (holiday: Holiday) => {
        if (!companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/holidays/${holiday.id}`));
            toast({ title: 'Holiday Removed', description: `"${holiday.name}" has been removed.` });
        } catch (error) {
            console.error('Error deleting holiday:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove holiday.' });
        }
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
                        <CalendarDays className="h-5 w-5" />
                        Public Holidays
                    </CardTitle>
                    <CardDescription>
                        Manage company holidays. These days are excluded from leave day calculations.
                    </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Holiday
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Public Holiday</DialogTitle>
                            <DialogDescription>
                                Add a company holiday. Leave days that overlap with this date will not be counted.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="holiday-name">Holiday Name</Label>
                                <Input
                                    id="holiday-name"
                                    placeholder="e.g. Independence Day"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="holiday-date">Date</Label>
                                <Input
                                    id="holiday-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="recurring">Recurring Annually</Label>
                                    <p className="text-xs text-muted-foreground">
                                        This holiday repeats every year on the same date.
                                    </p>
                                </div>
                                <Switch
                                    id="recurring"
                                    checked={recurring}
                                    onCheckedChange={setRecurring}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={saving || !name.trim() || !date}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Add Holiday'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {holidays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No holidays configured</p>
                        <p className="text-sm">Add public holidays to exclude them from leave calculations.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Holiday Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell className="font-medium">{holiday.name}</TableCell>
                                    <TableCell>
                                        {format(parseISO(holiday.date), 'MMMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {holiday.recurring ? (
                                            <Badge variant="secondary" className="gap-1">
                                                <RotateCw className="h-3 w-3" />
                                                Recurring
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">One-time</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove Holiday</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to remove &quot;{holiday.name}&quot;? This date will no longer be excluded from leave calculations.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(holiday)}>
                                                        Remove
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
