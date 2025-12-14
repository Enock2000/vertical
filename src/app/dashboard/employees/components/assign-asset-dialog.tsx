'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Employee, Asset } from '@/lib/data';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface AssignAssetDialogProps {
    children: React.ReactNode;
    employee: Employee;
    onAssetAssigned?: () => void;
}

export function AssignAssetDialog({ children, employee, onAssetAssigned }: AssignAssetDialogProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !companyId) return;

        setLoading(true);
        const assetsRef = ref(db, `companies/${companyId}/assets`);

        const unsubscribe = onValue(assetsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const assetList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                })) as Asset[];
                // Filter to show available assets (not assigned or assigned to this employee)
                const availableAssets = assetList.filter(
                    a => !a.assignedTo || a.assignedTo === employee.id
                );
                setAssets(availableAssets);
            } else {
                setAssets([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [open, companyId, employee.id]);

    const handleAssign = async (asset: Asset) => {
        if (!companyId) return;

        setAssigning(asset.id);
        try {
            const assetRef = ref(db, `companies/${companyId}/assets/${asset.id}`);
            await update(assetRef, {
                assignedTo: employee.id,
                assignedToName: employee.name,
                assignedDate: new Date().toISOString(),
                status: 'In Use',
            });

            toast({
                title: "Asset Assigned",
                description: `${asset.name} has been assigned to ${employee.name}`,
            });

            onAssetAssigned?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign asset",
            });
        } finally {
            setAssigning(null);
        }
    };

    const handleUnassign = async (asset: Asset) => {
        if (!companyId) return;

        setAssigning(asset.id);
        try {
            const assetRef = ref(db, `companies/${companyId}/assets/${asset.id}`);
            await update(assetRef, {
                assignedTo: null,
                assignedToName: null,
                assignedDate: null,
                status: 'Available',
            });

            toast({
                title: "Asset Unassigned",
                description: `${asset.name} has been unassigned from ${employee.name}`,
            });

            onAssetAssigned?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to unassign asset",
            });
        } finally {
            setAssigning(null);
        }
    };

    const getConditionBadge = (condition: string) => {
        switch (condition) {
            case 'Excellent':
                return <Badge className="bg-green-100 text-green-700">Excellent</Badge>;
            case 'Good':
                return <Badge className="bg-blue-100 text-blue-700">Good</Badge>;
            case 'Fair':
                return <Badge className="bg-yellow-100 text-yellow-700">Fair</Badge>;
            case 'Poor':
                return <Badge className="bg-red-100 text-red-700">Poor</Badge>;
            default:
                return <Badge variant="secondary">{condition}</Badge>;
        }
    };

    const assignedAssets = assets.filter(a => a.assignedTo === employee.id);
    const availableAssets = assets.filter(a => !a.assignedTo);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Assign Assets to {employee.name}
                    </DialogTitle>
                    <DialogDescription>
                        Select assets to assign or unassign from this employee
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[55vh] px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Currently Assigned */}
                            {assignedAssets.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Currently Assigned ({assignedAssets.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {assignedAssets.map(asset => (
                                            <Card key={asset.id} className="border-green-200 bg-green-50 dark:bg-green-950">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                                                <Package className="h-5 w-5 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{asset.name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <span>{asset.category}</span>
                                                                    {asset.serialNumber && <span>• SN: {asset.serialNumber}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getConditionBadge(asset.condition)}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleUnassign(asset)}
                                                                disabled={assigning === asset.id}
                                                            >
                                                                {assigning === asset.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    'Unassign'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Assets */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Available Assets ({availableAssets.length})
                                </h3>
                                {availableAssets.length > 0 ? (
                                    <div className="grid gap-3">
                                        {availableAssets.map(asset => (
                                            <Card key={asset.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-muted rounded-lg">
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{asset.name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <span>{asset.category}</span>
                                                                    {asset.serialNumber && <span>• SN: {asset.serialNumber}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getConditionBadge(asset.condition)}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAssign(asset)}
                                                                disabled={assigning === asset.id}
                                                            >
                                                                {assigning === asset.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    'Assign'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                                        <p className="font-medium">No Available Assets</p>
                                        <p className="text-sm">All assets are currently assigned to employees</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 pt-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
