'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
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
import { ref, push } from 'firebase/database';
import type { AssetCategory, AssetCondition } from '@/lib/data';
import { assetCategories } from '@/lib/data';

interface AddAssetDialogProps {
    companyId: string;
    children?: React.ReactNode;
}

export function AddAssetDialog({ companyId, children }: AddAssetDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '' as AssetCategory | '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        condition: 'Good' as AssetCondition,
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.category) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and category are required.' });
            return;
        }

        setLoading(true);
        try {
            const assetsRef = ref(db, `companies/${companyId}/assets`);
            await push(assetsRef, {
                companyId,
                name: formData.name,
                category: formData.category,
                serialNumber: formData.serialNumber || null,
                purchaseDate: formData.purchaseDate || null,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
                condition: formData.condition,
                status: 'Available',
                notes: formData.notes || null,
                createdAt: new Date().toISOString(),
            });

            toast({ title: 'Asset Added', description: `${formData.name} has been added to inventory.` });
            setOpen(false);
            setFormData({
                name: '',
                category: '',
                serialNumber: '',
                purchaseDate: '',
                purchasePrice: '',
                currentValue: '',
                condition: 'Good',
                notes: '',
            });
        } catch (error) {
            console.error('Add asset error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add asset.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        Add a new asset to your company inventory.
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
                                placeholder="e.g., Dell Laptop"
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
                                    <SelectValue placeholder="Select..." />
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
                            placeholder="e.g., SN-12345678"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate">Purchase Date</Label>
                            <Input
                                id="purchaseDate"
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                            />
                        </div>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price (ZMW)</Label>
                            <Input
                                id="purchasePrice"
                                type="number"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentValue">Current Value (ZMW)</Label>
                            <Input
                                id="currentValue"
                                type="number"
                                value={formData.currentValue}
                                onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this asset..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Asset'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
