'use client';

import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Asset, AssetCategory, AssetCondition, AssetStatus } from '@/lib/data';
import { assetCategories } from '@/lib/data';

interface EditAssetDialogProps {
    asset: Asset;
    companyId: string;
    children?: React.ReactNode;
}

export function EditAssetDialog({ asset, companyId, children }: EditAssetDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: asset.name,
        category: asset.category,
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate || '',
        purchasePrice: asset.purchasePrice?.toString() || '',
        currentValue: asset.currentValue?.toString() || '',
        condition: asset.condition,
        status: asset.status,
        notes: asset.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.category) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and category are required.' });
            return;
        }

        setLoading(true);
        try {
            const assetRef = ref(db, `companies/${companyId}/assets/${asset.id}`);
            await update(assetRef, {
                name: formData.name,
                category: formData.category,
                serialNumber: formData.serialNumber || null,
                purchaseDate: formData.purchaseDate || null,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
                condition: formData.condition,
                status: formData.status,
                notes: formData.notes || null,
            });

            toast({ title: 'Asset Updated', description: `${formData.name} has been updated.` });
            setOpen(false);
        } catch (error) {
            console.error('Update asset error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update asset.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                    <DialogDescription>
                        Update asset details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Asset Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val as AssetCategory }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {assetCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input
                            id="serialNumber"
                            value={formData.serialNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <Select
                                value={formData.condition}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, condition: val as AssetCondition }))}
                            >
                                <SelectTrigger>
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
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as AssetStatus }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Assigned">Assigned</SelectItem>
                                    <SelectItem value="Under Repair">Under Repair</SelectItem>
                                    <SelectItem value="Retired">Retired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price (ZMW)</Label>
                            <Input
                                id="purchasePrice"
                                type="number"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentValue">Current Value (ZMW)</Label>
                            <Input
                                id="currentValue"
                                type="number"
                                value={formData.currentValue}
                                onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
