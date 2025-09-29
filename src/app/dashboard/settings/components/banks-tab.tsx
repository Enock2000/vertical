
// src/app/dashboard/settings/components/banks-tab.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Bank } from '@/lib/data';
import { AddBankDialog } from './add-bank-dialog';
import { EditBankDialog } from './edit-bank-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/app/auth-provider';

interface BanksTabProps {
    banks: Bank[];
}

export function BanksTab({ banks }: BanksTabProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);

    const handleDeleteClick = (bank: Bank) => {
        setBankToDelete(bank);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!bankToDelete || !companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/banks/${bankToDelete.id}`));
            toast({
                title: "Bank Deleted",
                description: `"${bankToDelete.name}" has been removed.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete the bank.",
            });
        } finally {
            setIsAlertOpen(false);
            setBankToDelete(null);
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Bank Management</CardTitle>
                    <CardDescription>
                        Add, edit, or remove banks and their SWIFT codes.
                    </CardDescription>
                </div>
                <AddBankDialog>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                            Add Bank
                        </span>
                    </Button>
                </AddBankDialog>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>SWIFT Code</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banks.length > 0 ? banks.map((bank) => (
                                <TableRow key={bank.id}>
                                    <TableCell className="font-medium">{bank.name}</TableCell>
                                    <TableCell>{bank.swiftCode}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <EditBankDialog bank={bank}>
                                                        <div className="w-full text-left">Edit</div>
                                                    </EditBankDialog>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDeleteClick(bank)} className="text-red-600">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No banks found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the bank "{bankToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
