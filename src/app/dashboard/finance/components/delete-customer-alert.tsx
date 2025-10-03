// src/app/dashboard/finance/components/delete-customer-alert.tsx
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
import { useAuth } from '@/app/auth-provider';

interface DeleteCustomerAlertProps {
  children: React.ReactNode;
  customerId: string;
  customerName: string;
  onCustomerDeleted: () => void;
}

export function DeleteCustomerAlert({
  children,
  customerId,
  customerName,
  onCustomerDeleted,
}: DeleteCustomerAlertProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      await remove(ref(db, `companies/${companyId}/customers/${customerId}`));
      onCustomerDeleted();
      setOpen(false);
      toast({
        title: 'Customer Deleted',
        description: `The customer "${customerName}" has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete customer',
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
            This action cannot be undone. This will permanently delete the customer{' '}
            <strong>{customerName}</strong> and any associated invoices.
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
              'Yes, delete customer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
