
// src/app/dashboard/organization/components/shifts-tab.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { AddShiftDialog } from './add-shift-dialog';
import type { Shift } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditShiftDialog } from './edit-shift-dialog';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';


interface ShiftsTabProps {
    shifts: Shift[];
    onAction: () => void;
}

export function ShiftsTab({ shifts, onAction }: ShiftsTabProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);

    const handleDelete = async () => {
        if (!shiftToDelete || !companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/shifts/${shiftToDelete.id}`));
            toast({ title: "Shift Deleted", description: `The shift "${shiftToDelete.name}" has been removed.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete shift." });
        } finally {
            setShiftToDelete(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Shifts</CardTitle>
                    <CardDescription>
                        Manage work shifts for your organization.
                    </CardDescription>
                </div>
                <AddShiftDialog onShiftAdded={onAction}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                            Add Shift
                        </span>
                    </Button>
                </AddShiftDialog>
            </CardHeader>
            <CardContent>
                {shifts.length > 0 ? (
                    <div className="border rounded-md">
                        <ul className="divide-y">
                           {shifts.map(shift => (
                               <li key={shift.id} className="flex items-center justify-between p-4">
                                   <div className="flex items-center gap-4">
                                       <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shift.color }} />
                                       <div>
                                            <p className="font-semibold">{shift.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {shift.startTime} - {shift.endTime}
                                            </p>
                                       </div>
                                   </div>
                                   <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <EditShiftDialog shift={shift} onShiftUpdated={onAction}>
                                                    <div className="w-full text-left">Edit</div>
                                                </EditShiftDialog>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setShiftToDelete(shift)} className="text-red-600">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                   </DropdownMenu>
                               </li>
                           ))}
                        </ul>
                    </div>
                ) : (
                     <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No shifts found. Add one to get started.</p>
                    </div>
                )}
                 {shiftToDelete && (
                    <AlertDialog open={!!shiftToDelete} onOpenChange={() => setShiftToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the <strong>{shiftToDelete.name}</strong> shift.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
            </CardContent>
        </Card>
    );
}
