'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteEmployeeAlertProps {
  children: React.ReactNode;
  employeeId: string;
  employeeName: string;
  onEmployeeDeleted: () => void;
}

export function DeleteEmployeeAlert({
  children,
  employeeId,
  employeeName,
  onEmployeeDeleted,
}: DeleteEmployeeAlertProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Note: This only removes the database record.
      // In a production app, you would also need a Firebase Function
      // to delete the corresponding Firebase Auth user.
      await remove(ref(db, `employees/${employeeId}`));
      
      onEmployeeDeleted();
      setOpen(false);
      toast({
        title: 'Employee Deleted',
        description: `The employee "${employeeName}" has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete employee',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the employee record for{' '}
            <strong>{employeeName}</strong>. The associated user account will still exist and must be manually removed from Firebase Authentication.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Yes, delete employee'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
