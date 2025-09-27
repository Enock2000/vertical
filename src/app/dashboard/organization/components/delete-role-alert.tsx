// src/app/dashboard/organization/components/delete-role-alert.tsx
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
import { Button } from '@/components/ui/button';


interface DeleteRoleAlertProps {
  children: React.ReactNode;
  roleId: string;
  roleName: string;
  onRoleDeleted: () => void;
}

export function DeleteRoleAlert({
  children,
  roleId,
  roleName,
  onRoleDeleted,
}: DeleteRoleAlertProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await remove(ref(db, `roles/${roleId}`));
      onRoleDeleted();
      setOpen(false);
      toast({
        title: 'Role Deleted',
        description: `The role "${roleName}" has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete role',
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
            This action cannot be undone. This will permanently delete the{' '}
            <strong>{roleName}</strong> role.
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
              'Yes, delete role'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
