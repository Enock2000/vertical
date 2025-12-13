'use client';

import { useState } from 'react';
import { Loader2, UserMinus, CheckCircle2, Circle, Package, Printer, CheckCircle } from 'lucide-react';
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
import { useAuth } from '@/app/auth-provider';
import type { Employee, OffboardingReason, OffboardingChecklistItem, AssetReturnRecord } from '@/lib/data';
import { defaultOffboardingChecklist } from '@/lib/data';
import { format } from 'date-fns';
import { CollectAssetsDialog } from './collect-assets-dialog';

interface OffboardEmployeeDialogProps {
    employee: Employee;
    onComplete?: () => void;
    children?: React.ReactNode;
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
    const [returnedAssets, setReturnedAssets] = useState<AssetReturnRecord[]>([]);
    const [checklist, setChecklist] = useState<OffboardingChecklistItem[]>(
        defaultOffboardingChecklist.map((item, index) => ({
            ...item,
            id: `item-${index}`,
        }))
    );

    const toggleChecklistItem = (itemId: string) => {
        if (itemId === 'item-0') return;

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

    const handleAssetsCollected = (assets: AssetReturnRecord[]) => {
        setReturnedAssets(assets);
        setChecklist((prev) =>
            prev.map((item) =>
                item.id === 'item-0'
                    ? {
                        ...item,
                        completed: true,
                        completedAt: new Date().toISOString(),
                        completedBy: currentUser?.name || null,
                        notes: `${assets.length} asset(s) collected`,
                    }
                    : item
            )
        );
    };

    const handlePrintHandover = () => {
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

          ${returnedAssets.length > 0 ? `
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
                ${returnedAssets.map(asset => `
                  <tr>
                    <td>${asset.assetName}</td>
                    <td>${asset.category}</td>
                    <td>${asset.serialNumber || '-'}</td>
                    <td>${asset.returnCondition}</td>
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
            setReturnedAssets([]);
            setChecklist(defaultOffboardingChecklist.map((item, index) => ({
                ...item,
                id: `item-${index}`,
            })));
        }
        setOpen(newOpen);
    };

    const completedCount = checklist.filter((item) => item.completed).length;

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
                                <Button onClick={handleClose}>
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
                                            <CollectAssetsDialog
                                                key={item.id}
                                                employee={employee}
                                                companyId={companyId!}
                                                onComplete={handleAssetsCollected}
                                            >
                                                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                                                    {item.completed ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                    )}
                                                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                                        {item.label}
                                                    </span>
                                                    <Package className="h-4 w-4 text-muted-foreground ml-auto" />
                                                </div>
                                            </CollectAssetsDialog>
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

                            {returnedAssets.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                                    ✓ {returnedAssets.length} asset(s) collected
                                </div>
                            )}

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
