
// src/app/dashboard/employees/components/demote-admin-dialog.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldOff } from 'lucide-react';
import type { Employee } from '@/lib/data';

interface DemoteAdminDialogProps {
  children: React.ReactNode;
  employee: Employee;
  onEmployeeDemoted: () => void;
}

export function DemoteAdminDialog({
  children,
  employee,
  onEmployeeDemoted,
}: DemoteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDemote = async () => {
    setIsLoading(true);
    try {
      const employeeRef = ref(db, `employees/${employee.id}`);
      
      const updates = {
          role: employee.jobTitle || 'Employee', // Revert to original job title or a default
          adminRoleId: null,
          jobTitle: null,
      };

      await update(employeeRef, updates);
      
      onEmployeeDemoted();
      setOpen(false);
      toast({
        title: 'Employee Demoted',
        description: `${employee.name} is no longer an Admin.`,
      });
    } catch (error: any) {
      console.error('Error demoting employee:', error);
      toast({
        variant: 'destructive',
        title: 'Demotion Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to demote {employee.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will revoke all administrative privileges for this user. Their role will be reverted to{' '}
            <strong>{employee.jobTitle || 'Employee'}</strong>. This action can be reversed by promoting them again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDemote}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Demoting...
              </>
            ) : (
                 <>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Yes, demote user
                 </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
