'use client';

import { useState } from 'react';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import type { Asset, Employee } from '@/lib/data';

interface AssignAssetDialogProps {
    asset: Asset;
    employees: Employee[];
    companyId: string;
    children?: React.ReactNode;
}

export function AssignAssetDialog({ asset, employees, companyId, children }: AssignAssetDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(asset.assignedTo || '');

    const handleAssign = async () => {
        setLoading(true);
        try {
            const assetRef = ref(db, `companies/${companyId}/assets/${asset.id}`);

            if (selectedEmployee) {
                const employee = employees.find(e => e.id === selectedEmployee);
                await update(assetRef, {
                    status: 'Assigned',
                    assignedTo: selectedEmployee,
                    assignedToName: employee?.name || null,
                    assignedAt: new Date().toISOString(),
                });
                toast({ title: 'Asset Assigned', description: `${asset.name} assigned to ${employee?.name}.` });
            } else {
                // Unassign
                await update(assetRef, {
                    status: 'Available',
                    assignedTo: null,
                    assignedToName: null,
                    assignedAt: null,
                });
                toast({ title: 'Asset Unassigned', description: `${asset.name} is now available.` });
            }

            setOpen(false);
        } catch (error) {
            console.error('Assign error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update assignment.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async () => {
        setLoading(true);
        try {
            const assetRef = ref(db, `companies/${companyId}/assets/${asset.id}`);
            await update(assetRef, {
                status: 'Available',
                assignedTo: null,
                assignedToName: null,
                assignedAt: null,
            });
            toast({ title: 'Asset Unassigned', description: `${asset.name} is now available.` });
            setOpen(false);
        } catch (error) {
            console.error('Unassign error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to unassign asset.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Asset</DialogTitle>
                    <DialogDescription>
                        Assign <strong>{asset.name}</strong> ({asset.category}) to an employee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Employee</Label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an employee..." />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.name} - {emp.departmentName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {asset.status === 'Assigned' && asset.assignedToName && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p className="text-muted-foreground">Currently assigned to:</p>
                            <p className="font-medium">{asset.assignedToName}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {asset.status === 'Assigned' && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleUnassign}
                            disabled={loading}
                            className="mr-auto"
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unassign
                        </Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={loading || !selectedEmployee}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
