'use client';

import { useState, useEffect } from 'react';
import { Loader2, UserMinus, CheckCircle2, Circle, Package, Printer, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update, onValue } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Employee, OffboardingReason, OffboardingChecklistItem, AssetReturnRecord, Asset, AssetCondition } from '@/lib/data';
import { defaultOffboardingChecklist } from '@/lib/data';
import { format } from 'date-fns';

interface OffboardEmployeeDialogProps {
    employee: Employee;
    onComplete?: () => void;
    children?: React.ReactNode;
}

interface AssetCollectionItem {
    asset: Asset;
    collected: boolean;
    returnCondition: AssetCondition;
}

const offboardingReasons: { value: OffboardingReason; label: string }[] = [
    { value: 'Resigned', label: 'Resigned' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Terminated', label: 'Terminated' },
    { value: 'Contract Ended', label: 'Contract Ended' },
    { value: 'Redundant', label: 'Redundant / Laid Off' },
    { value: 'Other', label: 'Other' },
];

export function OffboardEmployeeDialog({ employee, onComplete, children }: OffboardEmployeeDialogProps) {
    const { toast } = useToast();
    const { employee: currentUser, companyId } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [reason, setReason] = useState<OffboardingReason | ''>('');
    const [otherReason, setOtherReason] = useState('');
    const [lastWorkingDay, setLastWorkingDay] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [exitNotes, setExitNotes] = useState('');
    const [finalSettlement, setFinalSettlement] = useState('');
    const [assetsExpanded, setAssetsExpanded] = useState(false);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetItems, setAssetItems] = useState<AssetCollectionItem[]>([]);
    const [checklist, setChecklist] = useState<OffboardingChecklistItem[]>(
        defaultOffboardingChecklist.map((item, index) => ({
            ...item,
            id: `item-${index}`,
        }))
    );

    // Load assigned assets when dialog opens
    useEffect(() => {
        if (!open || !companyId) return;

        setAssetsLoading(true);
        const assetsRef = ref(db, `companies/${companyId}/assets`);
        const unsubscribe = onValue(assetsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const assignedAssets = Object.keys(data)
                    .map(key => ({ ...data[key], id: key }))
                    .filter((asset: Asset) => asset.assignedTo === employee.id);

                setAssetItems(assignedAssets.map(asset => ({
                    asset,
                    collected: false,
                    returnCondition: asset.condition || 'Good',
                })));
            } else {
                setAssetItems([]);
            }
            setAssetsLoading(false);
        });

        return () => unsubscribe();
    }, [open, companyId, employee.id]);

    // Update checklist item when assets are collected
    useEffect(() => {
        const collectedCount = assetItems.filter(a => a.collected).length;
        if (collectedCount > 0 && assetItems.length > 0) {
            setChecklist(prev => prev.map(item =>
                item.id === 'item-0'
                    ? {
                        ...item,
                        completed: collectedCount === assetItems.length,
                        completedAt: new Date().toISOString(),
                        completedBy: currentUser?.name || null,
                        notes: `${collectedCount}/${assetItems.length} assets collected`,
                    }
                    : item
            ));
        }
    }, [assetItems, currentUser?.name]);

    const toggleChecklistItem = (itemId: string) => {
        if (itemId === 'item-0') {
            setAssetsExpanded(!assetsExpanded);
            return;
        }

        setChecklist((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        completed: !item.completed,
                        completedAt: !item.completed ? new Date().toISOString() : null,
                        completedBy: !item.completed ? currentUser?.name || null : null,
                    }
                    : item
            )
        );
    };

    const toggleAssetCollected = (index: number) => {
        setAssetItems(prev => prev.map((item, i) =>
            i === index ? { ...item, collected: !item.collected } : item
        ));
    };

    const markAllAssetsCollected = () => {
        setAssetItems(prev => prev.map(item => ({ ...item, collected: true })));
    };

    const handlePrintHandover = () => {
        const collectedAssets = assetItems.filter(a => a.collected);
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Offboarding Handover Form - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin: 5px 0; }
            .info-label { color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
            .checklist-item { padding: 5px 0; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
            .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; }
            .signature-label { color: #666; font-size: 14px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Employee Offboarding Form</h1>
          <p class="subtitle">Exit Documentation</p>
          
          <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Name:</span> ${employee.name}</div>
              <div class="info-item"><span class="info-label">Department:</span> ${employee.departmentName}</div>
              <div class="info-item"><span class="info-label">Exit Reason:</span> ${reason}${otherReason ? ` - ${otherReason}` : ''}</div>
              <div class="info-item"><span class="info-label">Last Working Day:</span> ${format(new Date(lastWorkingDay), 'PPP')}</div>
            </div>
          </div>

          ${collectedAssets.length > 0 ? `
          <div class="section">
            <div class="section-title">Assets Returned</div>
            <table>
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                ${collectedAssets.map(item => `
                  <tr>
                    <td>${item.asset.name}</td>
                    <td>${item.asset.category}</td>
                    <td>${item.asset.serialNumber || '-'}</td>
                    <td>${item.returnCondition}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Offboarding Checklist</div>
            ${checklist.map(item => `
              <div class="checklist-item">
                ${item.completed ? '☑' : '☐'} ${item.label}
              </div>
            `).join('')}
          </div>

          ${exitNotes ? `
          <div class="section">
            <div class="section-title">Exit Interview Notes</div>
            <p>${exitNotes}</p>
          </div>
          ` : ''}

          <div class="signatures">
            <div>
              <div class="signature-box">
                <div class="signature-label">Employee Signature</div>
              </div>
            </div>
            <div>
              <div class="signature-box">
                <div class="signature-label">HR/Admin Signature</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleOffboard = async () => {
        if (!reason) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please select an offboarding reason.',
            });
            return;
        }

        if (reason === 'Other' && !otherReason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Reason Details Required',
                description: 'Please specify the offboarding reason.',
            });
            return;
        }

        setLoading(true);

        try {
            // Update collected assets to Available status
            const collectedAssets = assetItems.filter(a => a.collected);
            for (const item of collectedAssets) {
                const assetRef = ref(db, `companies/${companyId}/assets/${item.asset.id}`);
                await update(assetRef, {
                    status: 'Available',
                    condition: item.returnCondition,
                    assignedTo: null,
                    assignedToName: null,
                    assignedAt: null,
                });
            }

            // Create return records
            const returnedAssets: AssetReturnRecord[] = collectedAssets.map(item => ({
                assetId: item.asset.id,
                assetName: item.asset.name,
                category: item.asset.category,
                serialNumber: item.asset.serialNumber || undefined,
                returnedAt: new Date().toISOString(),
                returnCondition: item.returnCondition,
            }));

            const offboardingRecord: Record<string, unknown> = {
                reason,
                offboardedAt: new Date().toISOString(),
                offboardedBy: currentUser?.name || 'Admin',
                lastWorkingDay,
                checklist: checklist.map(item => ({
                    ...item,
                    completedAt: item.completedAt || null,
                    completedBy: item.completedBy || null,
                    notes: item.notes || null,
                })),
                finalSettlementPaid: false,
            };

            if (reason === 'Other' && otherReason.trim()) {
                offboardingRecord.otherReason = otherReason.trim();
            }
            if (exitNotes.trim()) {
                offboardingRecord.exitInterviewNotes = exitNotes.trim();
            }
            if (finalSettlement) {
                offboardingRecord.finalSettlementAmount = parseFloat(finalSettlement);
            }
            if (returnedAssets.length > 0) {
                offboardingRecord.returnedAssets = returnedAssets;
            }

            await update(ref(db, `employees/${employee.id}`), {
                status: 'Offboarded',
                offboarding: offboardingRecord,
            });

            setSuccess(true);
        } catch (error) {
            console.error('Offboarding error:', error);
            toast({
                variant: 'destructive',
                title: 'Offboarding Failed',
                description: 'Could not offboard employee. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && success) {
            onComplete?.();
            setSuccess(false);
            setReason('');
            setOtherReason('');
            setExitNotes('');
            setFinalSettlement('');
            setAssetItems([]);
            setAssetsExpanded(false);
            setChecklist(defaultOffboardingChecklist.map((item, index) => ({
                ...item,
                id: `item-${index}`,
            })));
        }
        setOpen(newOpen);
    };

    const completedCount = checklist.filter((item) => item.completed).length;
    const collectedAssetsCount = assetItems.filter(a => a.collected).length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Offboard Employee
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                {success ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                Offboarding Complete
                            </DialogTitle>
                            <DialogDescription>
                                {employee.name} has been successfully offboarded.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <p className="text-muted-foreground mb-6">
                                The employee record has been archived. You can now print the handover form.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" onClick={handlePrintHandover}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Handover Form
                                </Button>
                                <Button onClick={() => handleOpenChange(false)}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserMinus className="h-5 w-5 text-destructive" />
                                Offboard Employee
                            </DialogTitle>
                            <DialogDescription>
                                Complete the offboarding process for <strong>{employee.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Exit Reason *</Label>
                                <Select value={reason} onValueChange={(val) => setReason(val as OffboardingReason)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {offboardingReasons.map((r) => (
                                            <SelectItem key={r.value} value={r.value}>
                                                {r.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {reason === 'Other' && (
                                <div className="space-y-2">
                                    <Label htmlFor="otherReason">Specify Reason *</Label>
                                    <Input
                                        id="otherReason"
                                        value={otherReason}
                                        onChange={(e) => setOtherReason(e.target.value)}
                                        placeholder="Enter the reason..."
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                                <Input
                                    id="lastWorkingDay"
                                    type="date"
                                    value={lastWorkingDay}
                                    onChange={(e) => setLastWorkingDay(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Offboarding Checklist ({completedCount}/{checklist.length})</Label>
                                <div className="border rounded-lg p-3 space-y-2">
                                    {checklist.map((item, index) => (
                                        index === 0 ? (
                                            // Asset Collection - Expandable Section
                                            <Collapsible key={item.id} open={assetsExpanded} onOpenChange={setAssetsExpanded}>
                                                <CollapsibleTrigger asChild>
                                                    <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                                                        {item.completed ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                        )}
                                                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                                            {item.label}
                                                        </span>
                                                        {assetItems.length > 0 && (
                                                            <Badge variant="secondary" className="ml-auto mr-2">
                                                                {collectedAssetsCount}/{assetItems.length}
                                                            </Badge>
                                                        )}
                                                        {assetsExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="ml-8 mt-2 space-y-2 border-l-2 pl-4">
                                                        {assetsLoading ? (
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Loading assets...
                                                            </div>
                                                        ) : assetItems.length === 0 ? (
                                                            <div className="text-sm text-muted-foreground py-2">
                                                                No assets assigned to this employee.
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-end mb-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={markAllAssetsCollected}
                                                                    >
                                                                        Mark All Collected
                                                                    </Button>
                                                                </div>
                                                                {assetItems.map((item, idx) => (
                                                                    <div
                                                                        key={item.asset.id}
                                                                        className={`flex items-center gap-3 p-2 rounded-md ${item.collected ? 'bg-green-50' : 'bg-muted/30'}`}
                                                                    >
                                                                        <Checkbox
                                                                            checked={item.collected}
                                                                            onCheckedChange={() => toggleAssetCollected(idx)}
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className={`text-sm ${item.collected ? 'line-through text-muted-foreground' : ''}`}>
                                                                                {item.asset.name}
                                                                            </span>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {item.asset.category}
                                                                                </Badge>
                                                                                {item.asset.serialNumber && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        SN: {item.asset.serialNumber}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {item.collected && (
                                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ) : (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                                onClick={() => toggleChecklistItem(item.id)}
                                            >
                                                {item.completed ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                )}
                                                <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="exitNotes">Exit Interview Notes</Label>
                                <Textarea
                                    id="exitNotes"
                                    value={exitNotes}
                                    onChange={(e) => setExitNotes(e.target.value)}
                                    placeholder="Add any notes from the exit interview..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="finalSettlement">Final Settlement Amount (ZMW)</Label>
                                <Input
                                    id="finalSettlement"
                                    type="number"
                                    value={finalSettlement}
                                    onChange={(e) => setFinalSettlement(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleOffboard} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <UserMinus className="h-4 w-4 mr-2" />
                                        Confirm Offboarding
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
