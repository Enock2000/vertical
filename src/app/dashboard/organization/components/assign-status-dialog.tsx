

// src/app/dashboard/roster/components/assign-status-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, set, remove } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Employee, RosterAssignment, Shift } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

interface AssignStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  date: Date | null;
  assignment: RosterAssignment | null;
  shifts: Shift[];
}

export function AssignStatusDialog({ open, onOpenChange, employee, date, assignment, shifts }: AssignStatusDialogProps) {
  const { companyId } = useAuth();
  const [selectedValue, setSelectedValue] = useState<string>(assignment?.shiftId || (assignment?.status === 'Off Day' ? 'off-day' : ''));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedValue(assignment?.shiftId || (assignment?.status === 'Off Day' ? 'off-day' : ''));
  }, [assignment]);

  if (!employee || !date || !companyId) return null;

  const dateString = format(date, 'yyyy-MM-dd');
  const rosterRef = ref(db, `companies/${companyId}/rosters/${dateString}/${employee.id}`);

  const handleSave = async () => {
    if (!selectedValue) {
        toast({ variant: 'destructive', title: 'Please select an option.' });
        return;
    }
    setIsLoading(true);
    
    let newAssignment: Omit<RosterAssignment, 'id' | 'companyId'>;
    let toastMessage: string;

    if (selectedValue === 'off-day') {
        newAssignment = {
            employeeId: employee.id,
            employeeName: employee.name,
            date: dateString,
            status: 'Off Day',
        };
        toastMessage = `${employee.name} has been set to "Off Day" on ${format(date, 'PPP')}.`
    } else {
        const selectedShift = shifts.find(s => s.id === selectedValue);
        if (!selectedShift) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid shift selected.' });
            setIsLoading(false);
            return;
        }
        newAssignment = {
            employeeId: employee.id,
            employeeName: employee.name,
            date: dateString,
            status: 'On Duty',
            shiftId: selectedShift.id,
            shiftName: selectedShift.name,
            shiftColor: selectedShift.color,
        };
        toastMessage = `${employee.name} has been assigned to "${selectedShift.name}" on ${format(date, 'PPP')}.`;
    }

    try {
        await set(rosterRef, newAssignment);
        toast({ title: 'Roster Updated', description: toastMessage });
        onOpenChange(false);
    } catch (error: any) {
        console.error('Failed to save assignment:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update roster.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleClear = async () => {
      setIsLoading(true);
      try {
          await remove(rosterRef);
          toast({ title: 'Assignment Cleared', description: `The assignment for ${employee.name} on ${format(date, 'PPP')} has been cleared.` });
          onOpenChange(false);
      } catch (error: any) {
           console.error('Failed to clear assignment:', error);
           toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear assignment.' });
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Status for {employee.name}</DialogTitle>
          <DialogDescription>
            Assign a shift or status for {format(date, 'MMMM d, yyyy')}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Select onValueChange={setSelectedValue} defaultValue={selectedValue}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a shift or status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="off-day">Off Day</SelectItem>
                    {shifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }}></span>
                                {shift.name} ({shift.startTime} - {shift.endTime})
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            {assignment && (
                 <Button variant="destructive" onClick={handleClear} disabled={isLoading}>
                    Clear Assignment
                </Button>
            )}
            <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
