'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Package, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Asset, AssetCategory, AssetStatus, Employee } from '@/lib/data';
import { assetCategories } from '@/lib/data';
import { AddAssetDialog } from './add-asset-dialog';
import { EditAssetDialog } from './edit-asset-dialog';
import { AssignAssetDialog } from './assign-asset-dialog';
import { format } from 'date-fns';

export default function AssetsPage() {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (!companyId) return;

        const assetsRef = ref(db, `companies/${companyId}/assets`);
        const employeesRef = ref(db, 'employees');

        const unsubscribeAssets = onValue(assetsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const assetList: Asset[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setAssets(assetList);
            } else {
                setAssets([]);
            }
            setLoading(false);
        });

        const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const empList = Object.values<Employee>(data).filter(
                    e => e.companyId === companyId && e.status !== 'Offboarded'
                );
                setEmployees(empList);
            }
        });

        return () => {
            unsubscribeAssets();
            unsubscribeEmployees();
        };
    }, [companyId]);

    const filteredAssets = assets.filter(asset => {
        const matchesSearch =
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const getStatusBadge = (status: AssetStatus) => {
        const variants: Record<AssetStatus, string> = {
            'Available': 'bg-green-500',
            'Assigned': 'bg-blue-500',
            'Under Repair': 'bg-yellow-500',
            'Retired': 'bg-gray-500',
        };
        return <Badge className={variants[status]}>{status}</Badge>;
    };

    const getConditionBadge = (condition: string) => {
        const variants: Record<string, string> = {
            'Excellent': 'bg-green-100 text-green-700',
            'Good': 'bg-blue-100 text-blue-700',
            'Fair': 'bg-yellow-100 text-yellow-700',
            'Poor': 'bg-red-100 text-red-700',
        };
        return <Badge variant="outline" className={variants[condition] || ''}>{condition}</Badge>;
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!companyId) return;
        try {
            await remove(ref(db, `companies/${companyId}/assets/${assetId}`));
            toast({ title: 'Asset Deleted', description: 'Asset has been removed.' });
        } catch (error) {
            console.error('Delete error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete asset.' });
        }
    };

    // Calculate stats
    const totalAssets = assets.length;
    const assignedCount = assets.filter(a => a.status === 'Assigned').length;
    const availableCount = assets.filter(a => a.status === 'Available').length;
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || a.purchasePrice || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Assets</CardDescription>
                        <CardTitle className="text-2xl">{totalAssets}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Assigned</CardDescription>
                        <CardTitle className="text-2xl text-blue-500">{assignedCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Available</CardDescription>
                        <CardTitle className="text-2xl text-green-500">{availableCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Value</CardDescription>
                        <CardTitle className="text-2xl">K{totalValue.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Asset Management
                        </CardTitle>
                        <CardDescription>
                            Manage company assets - laptops, phones, ID cards, keys, etc.
                        </CardDescription>
                    </div>
                    <AddAssetDialog companyId={companyId!}>
                        <Button size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add Asset
                        </Button>
                    </AddAssetDialog>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, serial number, or employee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {assetCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Assigned">Assigned</SelectItem>
                                <SelectItem value="Under Repair">Under Repair</SelectItem>
                                <SelectItem value="Retired">Retired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {filteredAssets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{assets.length === 0 ? 'No assets yet. Add your first asset.' : 'No assets match your filters.'}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Serial #</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">{asset.name}</TableCell>
                                        <TableCell>{asset.category}</TableCell>
                                        <TableCell className="text-muted-foreground">{asset.serialNumber || '-'}</TableCell>
                                        <TableCell>K{(asset.currentValue || asset.purchasePrice || 0).toLocaleString()}</TableCell>
                                        <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                                        <TableCell>{asset.assignedToName || '-'}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <AssignAssetDialog asset={asset} employees={employees} companyId={companyId!}>
                                                <Button variant="outline" size="sm">
                                                    {asset.status === 'Assigned' ? 'Reassign' : 'Assign'}
                                                </Button>
                                            </AssignAssetDialog>
                                            <EditAssetDialog asset={asset} companyId={companyId!}>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </EditAssetDialog>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDeleteAsset(asset.id)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
