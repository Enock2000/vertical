'use client';

import { useState, useEffect } from 'react';
import { Loader2, Package, CheckCircle2, Circle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import type { Asset, Employee, AssetCondition, AssetReturnRecord } from '@/lib/data';
import { format } from 'date-fns';

interface CollectAssetsDialogProps {
    employee: Employee;
    companyId: string;
    onComplete?: (returnedAssets: AssetReturnRecord[]) => void;
    children?: React.ReactNode;
}

interface AssetReturn {
    asset: Asset;
    returned: boolean;
    returnCondition: AssetCondition;
    notes: string;
}

export function CollectAssetsDialog({ employee, companyId, onComplete, children }: CollectAssetsDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [assetReturns, setAssetReturns] = useState<AssetReturn[]>([]);

    useEffect(() => {
        if (!open || !companyId) return;

        const assetsRef = ref(db, `companies/${companyId}/assets`);
        const unsubscribe = onValue(assetsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const assignedAssets = Object.keys(data)
                    .map(key => ({ ...data[key], id: key }))
                    .filter((asset: Asset) => asset.assignedTo === employee.id);

                setAssetReturns(assignedAssets.map(asset => ({
                    asset,
                    returned: false,
                    returnCondition: asset.condition,
                    notes: '',
                })));
            } else {
                setAssetReturns([]);
            }
            setAssetsLoading(false);
        });

        return () => unsubscribe();
    }, [open, companyId, employee.id]);

    const toggleReturned = (index: number) => {
        setAssetReturns(prev => prev.map((item, i) =>
            i === index ? { ...item, returned: !item.returned } : item
        ));
    };

    const updateCondition = (index: number, condition: AssetCondition) => {
        setAssetReturns(prev => prev.map((item, i) =>
            i === index ? { ...item, returnCondition: condition } : item
        ));
    };

    const updateNotes = (index: number, notes: string) => {
        setAssetReturns(prev => prev.map((item, i) =>
            i === index ? { ...item, notes } : item
        ));
    };

    const markAllReturned = () => {
        setAssetReturns(prev => prev.map(item => ({ ...item, returned: true })));
    };

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const returnedItems = assetReturns.filter(item => item.returned);

        if (returnedItems.length === 0) {
            toast({ variant: 'destructive', title: 'No Assets Marked', description: 'Please mark at least one asset as returned.' });
            return;
        }

        setLoading(true);
        try {
            // Update each returned asset to Available status
            for (const item of returnedItems) {
                const assetRef = ref(db, `companies/${companyId}/assets/${item.asset.id}`);
                await update(assetRef, {
                    status: 'Available',
                    condition: item.returnCondition,
                    assignedTo: null,
                    assignedToName: null,
                    assignedAt: null,
                    notes: item.notes || item.asset.notes || null,
                });
            }

            // Create return records for offboarding
            const returnRecords: AssetReturnRecord[] = returnedItems.map(item => ({
                assetId: item.asset.id,
                assetName: item.asset.name,
                category: item.asset.category,
                serialNumber: item.asset.serialNumber || null,
                returnedAt: new Date().toISOString(),
                returnCondition: item.returnCondition,
                notes: item.notes || null,
            }));

            toast({
                title: 'Assets Collected',
                description: `${returnedItems.length} asset(s) marked as returned.`
            });

            onComplete?.(returnRecords);
            setOpen(false);
        } catch (error) {
            console.error('Collect assets error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update assets.' });
        } finally {
            setLoading(false);
        }
    };

    const returnedCount = assetReturns.filter(a => a.returned).length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Collect Assets
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Collect Company Assets
                    </DialogTitle>
                    <DialogDescription>
                        Review and collect assets assigned to <strong>{employee.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {assetsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : assetReturns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No assets assigned to this employee.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {returnedCount} of {assetReturns.length} collected
                                </span>
                                <Button variant="outline" size="sm" onClick={markAllReturned}>
                                    Mark All Returned
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {assetReturns.map((item, index) => (
                                    <div
                                        key={item.asset.id}
                                        className={`border rounded-lg p-4 transition-colors ${item.returned ? 'bg-green-50 border-green-200' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleReturned(index)}
                                                className="mt-1"
                                            >
                                                {item.returned ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </button>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className={`font-medium ${item.returned ? 'line-through text-muted-foreground' : ''}`}>
                                                            {item.asset.name}
                                                        </span>
                                                        <Badge variant="outline" className="ml-2">{item.asset.category}</Badge>
                                                    </div>
                                                    {item.asset.serialNumber && (
                                                        <span className="text-sm text-muted-foreground">
                                                            SN: {item.asset.serialNumber}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.returned && (
                                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                                        <div>
                                                            <Label className="text-xs">Return Condition</Label>
                                                            <Select
                                                                value={item.returnCondition}
                                                                onValueChange={(val) => updateCondition(index, val as AssetCondition)}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Excellent">Excellent</SelectItem>
                                                                    <SelectItem value="Good">Good</SelectItem>
                                                                    <SelectItem value="Fair">Fair</SelectItem>
                                                                    <SelectItem value="Poor">Poor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">Notes</Label>
                                                            <Textarea
                                                                value={item.notes}
                                                                onChange={(e) => updateNotes(index, e.target.value)}
                                                                placeholder="Any damage or notes..."
                                                                className="h-8 min-h-8 resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(false); }} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading || returnedCount === 0}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm (${returnedCount})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
