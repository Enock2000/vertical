// src/app/dashboard/organization/components/branches-tab.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Branch } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddBranchDialog } from './add-branch-dialog';
import { EditBranchDialog } from './edit-branch-dialog';

interface BranchesTabProps {
    branches: Branch[];
    onAction: () => void;
}

export function BranchesTab({ branches, onAction }: BranchesTabProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

    const handleDelete = async () => {
        if (!branchToDelete || !companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/branches/${branchToDelete.id}`));
            toast({ title: "Branch Deleted", description: `The branch "${branchToDelete.name}" has been removed.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete branch." });
        } finally {
            setBranchToDelete(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Branches</CardTitle>
                    <CardDescription>
                        Manage your company's branches and their locations.
                    </CardDescription>
                </div>
                <AddBranchDialog onBranchAdded={onAction}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                            Add Branch
                        </span>
                    </Button>
                </AddBranchDialog>
            </CardHeader>
            <CardContent>
                {branches.length > 0 ? (
                    <div className="border rounded-md">
                        <ul className="divide-y">
                           {branches.map(branch => (
                               <li key={branch.id} className="flex items-center justify-between p-4">
                                   <div>
                                       <p className="font-semibold">{branch.name}</p>
                                       <p className="text-sm text-muted-foreground">{branch.location}</p>
                                       {branch.ipAddress && <p className="text-xs text-muted-foreground">IP: {branch.ipAddress}</p>}
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
                                                <EditBranchDialog branch={branch} onBranchUpdated={onAction}>
                                                    <div className="w-full text-left">Edit</div>
                                                </EditBranchDialog>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setBranchToDelete(branch)} className="text-red-600">
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
                        <p className="text-muted-foreground">No branches found. Add one to get started.</p>
                    </div>
                )}
                 {branchToDelete && (
                    <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the <strong>{branchToDelete.name}</strong> branch. This action cannot be undone.
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
