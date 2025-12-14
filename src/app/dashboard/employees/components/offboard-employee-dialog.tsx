'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, UserMinus, CheckCircle2, Circle, Package, Printer, CheckCircle, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
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
import { ref, update, onValue, get } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Employee, OffboardingReason, OffboardingChecklistItem, AssetReturnRecord, Asset, AssetCondition, PayrollConfig } from '@/lib/data';
import { defaultOffboardingChecklist, calculatePayroll } from '@/lib/data';
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

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

interface FinalCompensation {
    // Days worked calculation
    daysWorkedThisMonth: number;
    totalDaysInMonth: number;
    dailyRate: number;
    proratedSalary: number;
    // Notice period
    noticePeriodDays: number;
    noticeDaysServed: number;
    noticeDaysUnserved: number;
    noticeDeduction: number;
    // Leave payout
    outstandingLeaveDays: number;
    leavePayout: number;
    // Service details
    yearsOfService: number;
    monthsOfService: number;
    // Gratuity
    gratuityAmount: number;
    // Additional amounts
    allowances: number;
    bonus: number;
    additionalPayout: number;
    // Gross
    grossFinalPay: number;
    // Deductions
    napsaDeduction: number;
    nhimaDeduction: number;
    payeDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
    // Final
    netFinalPay: number;
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
    const [assetsExpanded, setAssetsExpanded] = useState(false);
    const [compensationExpanded, setCompensationExpanded] = useState(false);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetItems, setAssetItems] = useState<AssetCollectionItem[]>([]);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);

    // Compensation fields
    const [gratuityMonths, setGratuityMonths] = useState('0');
    const [additionalPayout, setAdditionalPayout] = useState('0');
    const [noticePeriodDays, setNoticePeriodDays] = useState('30');
    const [noticeServed, setNoticeServed] = useState(true);
    const [resignationDate, setResignationDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [checklist, setChecklist] = useState<OffboardingChecklistItem[]>(
        defaultOffboardingChecklist.map((item, index) => ({
            ...item,
            id: `item-${index}`,
        }))
    );

    // Load assigned assets and payroll config when dialog opens
    useEffect(() => {
        if (!open || !companyId) return;

        // Load assets
        setAssetsLoading(true);
        const assetsRef = ref(db, `companies/${companyId}/assets`);
        const unsubscribeAssets = onValue(assetsRef, (snapshot) => {
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

        // Load payroll config
        const configRef = ref(db, `companies/${companyId}/payrollConfig`);
        get(configRef).then((snapshot) => {
            if (snapshot.exists()) {
                setPayrollConfig(snapshot.val());
            }
        });

        return () => unsubscribeAssets();
    }, [open, companyId, employee.id]);

    // Calculate final compensation
    const finalCompensation = useMemo((): FinalCompensation | null => {
        if (!payrollConfig) return null;

        const lastDay = new Date(lastWorkingDay);
        const resignation = new Date(resignationDate);
        const monthStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
        const monthEnd = new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, 0);
        const totalDaysInMonth = monthEnd.getDate();
        const daysWorkedThisMonth = Math.max(0, differenceInDays(lastDay, monthStart) + 1);

        // Daily rate calculation
        const dailyRate = employee.salary / 30; // Standard 30-day month

        // 1. Prorated Salary for days worked in final month
        const proratedSalary = dailyRate * daysWorkedThisMonth;

        // 2. Notice Period Handling
        const noticePeriod = parseInt(noticePeriodDays) || 30;
        const actualNoticeDays = differenceInDays(lastDay, resignation);
        const noticeDaysServed = noticeServed ? Math.min(noticePeriod, Math.max(0, actualNoticeDays)) : 0;
        const noticeDaysUnserved = Math.max(0, noticePeriod - noticeDaysServed);
        // Deduction if notice not served (employee owes company)
        const noticeDeduction = noticeServed ? 0 : (dailyRate * noticeDaysUnserved);

        // 3. Accrued Leave Payout
        const outstandingLeaveDays = employee.annualLeaveBalance || 0;
        const leavePayout = outstandingLeaveDays * dailyRate;

        // 4. Years of Service
        const joinDate = new Date(employee.joinDate);
        const yearsOfService = differenceInYears(lastDay, joinDate);
        const monthsOfService = differenceInMonths(lastDay, joinDate);

        // 5. Gratuity/Severance (based on policy)
        const monthsForGratuity = parseFloat(gratuityMonths) || 0;
        // Gratuity = months of salary × years of service (common formula)
        const gratuityAmount = yearsOfService >= 1
            ? (employee.salary * monthsForGratuity)
            : 0;

        // 6. Other earnings
        const allowances = employee.allowances || 0;
        const bonus = employee.bonus || 0;
        const additional = parseFloat(additionalPayout) || 0;

        // 7. Gross Final Pay (before deductions)
        const grossBeforeNotice = proratedSalary + leavePayout + gratuityAmount + additional + allowances + bonus;
        const grossFinalPay = grossBeforeNotice - noticeDeduction;

        // 8. Statutory Deductions
        const napsaDeduction = Math.max(0, grossFinalPay * (payrollConfig.employeeNapsaRate / 100));
        const nhimaDeduction = Math.max(0, grossFinalPay * (payrollConfig.employeeNhimaRate / 100));

        // PAYE on taxable income
        const taxablePay = Math.max(0, grossFinalPay - napsaDeduction);
        const payeDeduction = Math.max(0, taxablePay * (payrollConfig.taxRate / 100));

        // Other deductions (loans, advances, etc.)
        const otherDeductions = employee.deductions || 0;

        const totalDeductions = napsaDeduction + nhimaDeduction + payeDeduction + otherDeductions;
        const netFinalPay = Math.max(0, grossFinalPay - totalDeductions);

        return {
            daysWorkedThisMonth,
            totalDaysInMonth,
            dailyRate,
            proratedSalary,
            noticePeriodDays: noticePeriod,
            noticeDaysServed,
            noticeDaysUnserved,
            noticeDeduction,
            outstandingLeaveDays,
            leavePayout,
            yearsOfService,
            monthsOfService,
            gratuityAmount,
            allowances,
            bonus,
            additionalPayout: additional,
            grossFinalPay,
            napsaDeduction,
            nhimaDeduction,
            payeDeduction,
            otherDeductions,
            totalDeductions,
            netFinalPay,
        };
    }, [employee, lastWorkingDay, resignationDate, payrollConfig, gratuityMonths, additionalPayout, noticePeriodDays, noticeServed]);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handlePrintHandover = () => {
        const collectedAssets = assetItems.filter(a => a.collected);
        const comp = finalCompensation;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Offboarding & Final Settlement - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .info-item { margin: 3px 0; }
            .info-label { color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .amount { text-align: right; font-family: monospace; }
            .total-row { font-weight: bold; background: #f9f9f9; }
            .net-row { font-weight: bold; background: #e6f3e6; font-size: 14px; }
            .deduction { color: #c00; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
            .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; }
            .signature-label { color: #666; font-size: 11px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Employee Final Settlement</h1>
          <p class="subtitle">Offboarding & Compensation Documentation</p>
          
          <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Name:</span> ${employee.name}</div>
              <div class="info-item"><span class="info-label">Department:</span> ${employee.departmentName}</div>
              <div class="info-item"><span class="info-label">Position:</span> ${employee.jobTitle || employee.role}</div>
              <div class="info-item"><span class="info-label">Join Date:</span> ${format(new Date(employee.joinDate), 'PPP')}</div>
              <div class="info-item"><span class="info-label">Exit Reason:</span> ${reason}${otherReason ? ` - ${otherReason}` : ''}</div>
              <div class="info-item"><span class="info-label">Last Working Day:</span> ${format(new Date(lastWorkingDay), 'PPP')}</div>
              <div class="info-item"><span class="info-label">Years of Service:</span> ${comp?.yearsOfService || 0} year(s)</div>
              <div class="info-item"><span class="info-label">Monthly Salary:</span> ${formatCurrency(employee.salary)}</div>
            </div>
          </div>

          ${comp ? `
          <div class="section">
            <div class="section-title">Final Compensation Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount (ZMW)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Prorated Salary (${comp.daysWorkedThisMonth} days)</td>
                  <td class="amount">${formatCurrency(comp.proratedSalary)}</td>
                </tr>
                <tr>
                  <td>Leave Payout (${comp.outstandingLeaveDays} days)</td>
                  <td class="amount">${formatCurrency(comp.leavePayout)}</td>
                </tr>
                <tr>
                  <td>Gratuity/Severance</td>
                  <td class="amount">${formatCurrency(comp.gratuityAmount)}</td>
                </tr>
                ${employee.allowances > 0 ? `
                <tr>
                  <td>Allowances</td>
                  <td class="amount">${formatCurrency(employee.allowances)}</td>
                </tr>
                ` : ''}
                ${employee.bonus > 0 ? `
                <tr>
                  <td>Bonus</td>
                  <td class="amount">${formatCurrency(employee.bonus)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td>Gross Final Pay</td>
                  <td class="amount">${formatCurrency(comp.grossFinalPay)}</td>
                </tr>
                <tr>
                  <td class="deduction">Less: NAPSA (${payrollConfig?.employeeNapsaRate || 5}%)</td>
                  <td class="amount deduction">-${formatCurrency(comp.napsaDeduction)}</td>
                </tr>
                <tr>
                  <td class="deduction">Less: NHIMA (${payrollConfig?.employeeNhimaRate || 1}%)</td>
                  <td class="amount deduction">-${formatCurrency(comp.nhimaDeduction)}</td>
                </tr>
                <tr>
                  <td class="deduction">Less: PAYE (${payrollConfig?.taxRate || 25}%)</td>
                  <td class="amount deduction">-${formatCurrency(comp.payeDeduction)}</td>
                </tr>
                ${comp.otherDeductions > 0 ? `
                <tr>
                  <td class="deduction">Less: Other Deductions</td>
                  <td class="amount deduction">-${formatCurrency(comp.otherDeductions)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td>Total Deductions</td>
                  <td class="amount deduction">-${formatCurrency(comp.totalDeductions)}</td>
                </tr>
                <tr class="net-row">
                  <td>NET FINAL PAYMENT</td>
                  <td class="amount">${formatCurrency(comp.netFinalPay)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}

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
              <div style="padding: 3px 0;">
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
                <div class="signature-label">Employee Signature & Date</div>
              </div>
            </div>
            <div>
              <div class="signature-box">
                <div class="signature-label">HR/Admin Signature & Date</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
            Generated on ${format(new Date(), 'PPP')} | Document Reference: OFF-${employee.id.slice(-6).toUpperCase()}
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
            if (finalCompensation) {
                offboardingRecord.finalSettlementAmount = finalCompensation.netFinalPay;
                offboardingRecord.finalSettlementDetails = finalCompensation;
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
            setAssetItems([]);
            setAssetsExpanded(false);
            setCompensationExpanded(false);
            setGratuityMonths('2');
            setAdditionalPayout('0');
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                            <p className="text-muted-foreground mb-2">
                                The employee record has been archived.
                            </p>
                            {finalCompensation && (
                                <p className="text-lg font-semibold text-green-600 mb-4">
                                    Final Settlement: {formatCurrency(finalCompensation.netFinalPay)}
                                </p>
                            )}
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" onClick={handlePrintHandover}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Settlement Form
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
                            <div className="grid grid-cols-2 gap-4">
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

                                <div className="space-y-2">
                                    <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                                    <Input
                                        id="lastWorkingDay"
                                        type="date"
                                        value={lastWorkingDay}
                                        onChange={(e) => setLastWorkingDay(e.target.value)}
                                    />
                                </div>
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

                            <Separator />

                            {/* Final Compensation Section */}
                            <Collapsible open={compensationExpanded} onOpenChange={setCompensationExpanded}>
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-green-600" />
                                            <span className="font-medium">Final Compensation</span>
                                        </div>
                                        {finalCompensation && (
                                            <Badge variant="secondary" className="mr-2">
                                                Net: {formatCurrency(finalCompensation.netFinalPay)}
                                            </Badge>
                                        )}
                                        {compensationExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="mt-3 p-4 border rounded-lg bg-muted/30 space-y-4">
                                        {/* Input Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Resignation/Termination Date</Label>
                                                <Input
                                                    type="date"
                                                    value={resignationDate}
                                                    onChange={(e) => setResignationDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Notice Period (Days)</Label>
                                                <Select value={noticePeriodDays} onValueChange={setNoticePeriodDays}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="7">7 Days</SelectItem>
                                                        <SelectItem value="14">14 Days</SelectItem>
                                                        <SelectItem value="30">30 Days (1 Month)</SelectItem>
                                                        <SelectItem value="60">60 Days (2 Months)</SelectItem>
                                                        <SelectItem value="90">90 Days (3 Months)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                                            <Checkbox
                                                id="noticeServed"
                                                checked={noticeServed}
                                                onCheckedChange={(checked) => setNoticeServed(!!checked)}
                                            />
                                            <div>
                                                <Label htmlFor="noticeServed" className="cursor-pointer">Notice Period Served</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {noticeServed
                                                        ? 'Employee will work through their notice period'
                                                        : 'Employee leaving immediately - salary deduction applies'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Gratuity/Severance</Label>
                                                <Select value={gratuityMonths} onValueChange={setGratuityMonths}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select months..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">0 Months (No Gratuity)</SelectItem>
                                                        <SelectItem value="0.5">0.5 Month</SelectItem>
                                                        <SelectItem value="1">1 Month</SelectItem>
                                                        <SelectItem value="2">2 Months</SelectItem>
                                                        <SelectItem value="3">3 Months</SelectItem>
                                                        <SelectItem value="4">4 Months</SelectItem>
                                                        <SelectItem value="6">6 Months</SelectItem>
                                                        <SelectItem value="12">12 Months (1 Year)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    {finalCompensation && parseFloat(gratuityMonths) > 0
                                                        ? `= ${formatCurrency(finalCompensation.gratuityAmount)}`
                                                        : 'Based on company policy'}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Additional Payout (ZMW)</Label>
                                                <Input
                                                    type="number"
                                                    value={additionalPayout}
                                                    onChange={(e) => setAdditionalPayout(e.target.value)}
                                                    min="0"
                                                    placeholder="0"
                                                />
                                                <p className="text-xs text-muted-foreground">Bonus, incentives, etc.</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Calculation Breakdown */}
                                        {finalCompensation && (
                                            <div className="space-y-3 text-sm">
                                                {/* Employee Info Summary */}
                                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div><span className="text-muted-foreground">Monthly Salary:</span> {formatCurrency(employee.salary)}</div>
                                                        <div><span className="text-muted-foreground">Daily Rate:</span> {formatCurrency(finalCompensation.dailyRate)}</div>
                                                        <div><span className="text-muted-foreground">Service:</span> {finalCompensation.yearsOfService} yrs {finalCompensation.monthsOfService % 12} mos</div>
                                                    </div>
                                                </div>

                                                {/* 1. Prorated Salary */}
                                                <div className="p-3 border rounded-lg">
                                                    <div className="flex justify-between font-medium mb-1">
                                                        <span className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">1</Badge>
                                                            Prorated Salary
                                                        </span>
                                                        <span>{formatCurrency(finalCompensation.proratedSalary)}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {finalCompensation.daysWorkedThisMonth} days × {formatCurrency(finalCompensation.dailyRate)}/day
                                                    </p>
                                                </div>

                                                {/* 2. Notice Period */}
                                                {!noticeServed && finalCompensation.noticeDeduction > 0 && (
                                                    <div className="p-3 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-950">
                                                        <div className="flex justify-between font-medium mb-1 text-orange-700 dark:text-orange-400">
                                                            <span className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs border-orange-300">2</Badge>
                                                                Notice Period Deduction
                                                            </span>
                                                            <span>-{formatCurrency(finalCompensation.noticeDeduction)}</span>
                                                        </div>
                                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                                            {finalCompensation.noticeDaysUnserved} unserved days × {formatCurrency(finalCompensation.dailyRate)}/day
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 3. Leave Payout */}
                                                <div className="p-3 border rounded-lg">
                                                    <div className="flex justify-between font-medium mb-1">
                                                        <span className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">3</Badge>
                                                            Accrued Leave Payout
                                                        </span>
                                                        <span>{formatCurrency(finalCompensation.leavePayout)}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {finalCompensation.outstandingLeaveDays} unused days × {formatCurrency(finalCompensation.dailyRate)}/day
                                                    </p>
                                                </div>

                                                {/* 4. Gratuity */}
                                                {finalCompensation.gratuityAmount > 0 && (
                                                    <div className="p-3 border rounded-lg">
                                                        <div className="flex justify-between font-medium mb-1">
                                                            <span className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">4</Badge>
                                                                Gratuity/Severance
                                                            </span>
                                                            <span>{formatCurrency(finalCompensation.gratuityAmount)}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {gratuityMonths} months × {formatCurrency(employee.salary)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Additional amounts */}
                                                {(finalCompensation.allowances > 0 || finalCompensation.bonus > 0 || finalCompensation.additionalPayout > 0) && (
                                                    <div className="p-3 border rounded-lg">
                                                        <div className="flex justify-between font-medium mb-1">
                                                            <span>Additional Earnings</span>
                                                            <span>{formatCurrency(finalCompensation.allowances + finalCompensation.bonus + finalCompensation.additionalPayout)}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            {finalCompensation.allowances > 0 && <div>Allowances: {formatCurrency(finalCompensation.allowances)}</div>}
                                                            {finalCompensation.bonus > 0 && <div>Bonus: {formatCurrency(finalCompensation.bonus)}</div>}
                                                            {finalCompensation.additionalPayout > 0 && <div>Additional: {formatCurrency(finalCompensation.additionalPayout)}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                <Separator />

                                                {/* Gross Pay */}
                                                <div className="flex justify-between font-semibold text-base bg-muted p-3 rounded-lg">
                                                    <span>Gross Final Pay</span>
                                                    <span>{formatCurrency(finalCompensation.grossFinalPay)}</span>
                                                </div>

                                                {/* Deductions */}
                                                <div className="p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950/30">
                                                    <div className="font-medium mb-2 text-red-700 dark:text-red-400">Statutory Deductions</div>
                                                    <div className="space-y-1 text-red-600 dark:text-red-400">
                                                        <div className="flex justify-between">
                                                            <span>NAPSA ({payrollConfig?.employeeNapsaRate || 5}%)</span>
                                                            <span>-{formatCurrency(finalCompensation.napsaDeduction)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>NHIMA ({payrollConfig?.employeeNhimaRate || 1}%)</span>
                                                            <span>-{formatCurrency(finalCompensation.nhimaDeduction)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>PAYE (Est. {payrollConfig?.taxRate || 25}%)</span>
                                                            <span>-{formatCurrency(finalCompensation.payeDeduction)}</span>
                                                        </div>
                                                        {finalCompensation.otherDeductions > 0 && (
                                                            <div className="flex justify-between">
                                                                <span>Other (Loans, etc.)</span>
                                                                <span>-{formatCurrency(finalCompensation.otherDeductions)}</span>
                                                            </div>
                                                        )}
                                                        <Separator className="my-1 bg-red-200" />
                                                        <div className="flex justify-between font-medium">
                                                            <span>Total Deductions</span>
                                                            <span>-{formatCurrency(finalCompensation.totalDeductions)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Net Pay */}
                                                <div className="flex justify-between font-bold text-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 p-4 rounded-lg">
                                                    <span>NET FINAL PAYMENT</span>
                                                    <span>{formatCurrency(finalCompensation.netFinalPay)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Separator />

                            {/* Checklist */}
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
                                    rows={2}
                                />
                            </div>
                        </div >

                        <DialogFooter className="flex justify-between sm:justify-between">
                            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrintHandover} disabled={!reason}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Preview PDF
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
                            </div>
                        </DialogFooter>
                    </>
                )
                }
            </DialogContent >
        </Dialog >
    );
}
