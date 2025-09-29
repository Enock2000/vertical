
// src/app/dashboard/roster/components/assign-status-dialog.tsx
'use client';

import { useState } from 'react';
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
import type { Employee, RosterAssignment } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

interface AssignStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  date: Date | null;
  assignment: RosterAssignment | null;
}

export function AssignStatusDialog({ open, onOpenChange, employee, date, assignment }: AssignStatusDialogProps) {
  const { companyId } = useAuth();
  const [status, setStatus] = useState<RosterAssignment['status'] | ''>(assignment?.status || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!employee || !date || !companyId) return null;

  const dateString = format(date, 'yyyy-MM-dd');
  const rosterRef = ref(db, `companies/${companyId}/rosters/${dateString}/${employee.id}`);

  const handleSave = async () => {
    if (!status) {
        toast({ variant: 'destructive', title: 'Please select a status.' });
        return;
    }
    setIsLoading(true);
    try {
        const newAssignment: Omit<RosterAssignment, 'id' | 'companyId'> = {
            employeeId: employee.id,
            employeeName: employee.name,
            date: dateString,
            status: status as RosterAssignment['status'],
        };
        await set(rosterRef, newAssignment);
        toast({ title: 'Roster Updated', description: `${employee.name} has been set to "${status}" on ${format(date, 'PPP')}.` });
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
            Assign a status for {format(date, 'MMMM d, yyyy')}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Select onValueChange={(value) => setStatus(value as RosterAssignment['status'])} defaultValue={status}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="On Duty">On Duty</SelectItem>
                    <SelectItem value="Off Day">Off Day</SelectItem>
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
