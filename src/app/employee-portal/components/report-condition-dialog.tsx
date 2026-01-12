'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Home, Clock, LogOut, Siren, ThermometerSun, Upload } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { uploadToB2 } from '@/lib/backblaze';
import { createNotification, getAdminUserIds } from '@/lib/data';
import type { Employee, ConditionType, ConditionReport } from '@/lib/data';

interface ReportConditionDialogProps {
    employee: Employee;
    children: React.ReactNode;
}

const conditionTypes: { value: ConditionType; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'Sick', label: 'Sick', icon: ThermometerSun, description: 'Feeling unwell, cannot work today' },
    { value: 'WFH', label: 'Working from Home', icon: Home, description: 'Working remotely for the day' },
    { value: 'Late', label: 'Late Arrival', icon: Clock, description: 'Will arrive late today' },
    { value: 'EarlyDeparture', label: 'Early Departure', icon: LogOut, description: 'Need to leave early today' },
    { value: 'Emergency', label: 'Emergency', icon: Siren, description: 'Personal or family emergency' },
];

const formSchema = z.object({
    type: z.enum(['Sick', 'WFH', 'Late', 'EarlyDeparture', 'Emergency']),
    date: z.string().min(1, 'Date is required'),
    reason: z.string().optional(),
    estimatedArrivalTime: z.string().optional(),
    departureTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ReportConditionDialog({ employee, children }: ReportConditionDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'Sick',
            date: format(new Date(), 'yyyy-MM-dd'),
            reason: '',
            estimatedArrivalTime: '',
            departureTime: '',
        },
    });

    const selectedType = form.watch('type');

    const handleSubmit = async (values: FormValues) => {
        if (!employee.companyId) return;

        setIsSubmitting(true);
        try {
            let attachmentUrl: string | undefined;

            // Upload attachment if provided
            if (attachmentFile) {
                setIsUploading(true);
                const path = `condition-reports/${employee.companyId}/${employee.id}/${Date.now()}_${attachmentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const result = await uploadToB2(attachmentFile, path);
                if (result.success && result.url) {
                    attachmentUrl = result.url;
                }
                setIsUploading(false);
            }

            // Create the condition report
            const reportsRef = ref(db, `companies/${employee.companyId}/conditionReports`);
            const newReportRef = push(reportsRef);

            const newReport: Record<string, any> = {
                employeeId: employee.id,
                employeeName: employee.name,
                companyId: employee.companyId,
                type: values.type,
                date: values.date,
                createdAt: new Date().toISOString(),
                status: 'Pending',
            };

            // Only add optional fields if they have values (Firebase rejects undefined)
            if (values.reason) newReport.reason = values.reason;
            if (values.type === 'Late' && values.estimatedArrivalTime) {
                newReport.estimatedArrivalTime = values.estimatedArrivalTime;
            }
            if (values.type === 'EarlyDeparture' && values.departureTime) {
                newReport.departureTime = values.departureTime;
            }
            if (attachmentUrl) newReport.attachmentUrl = attachmentUrl;

            await set(newReportRef, { ...newReport, id: newReportRef.key });

            // Notify admins
            const adminIds = await getAdminUserIds(employee.companyId);
            const conditionLabel = conditionTypes.find(c => c.value === values.type)?.label || values.type;
            for (const adminId of adminIds) {
                await createNotification(employee.companyId, {
                    userId: adminId,
                    title: 'New Condition Report',
                    message: `${employee.name} has reported: ${conditionLabel}`,
                    link: '/dashboard/roster?tab=conditions',
                });
            }

            toast({
                title: 'Report Submitted',
                description: 'Your condition has been reported to management.',
            });

            setOpen(false);
            form.reset();
            setAttachmentFile(null);
        } catch (error) {
            console.error('Failed to submit condition report:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to submit report. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Report Condition</DialogTitle>
                    <DialogDescription>
                        Let your manager know about your current status or situation.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Condition Type */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {conditionTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className="h-4 w-4" />
                                                        <span>{type.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {conditionTypes.find(c => c.value === selectedType)?.description}
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Estimated Arrival Time (for Late) */}
                        {selectedType === 'Late' && (
                            <FormField
                                control={form.control}
                                name="estimatedArrivalTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Arrival Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Departure Time (for Early Departure) */}
                        {selectedType === 'EarlyDeparture' && (
                            <FormField
                                control={form.control}
                                name="departureTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Planned Departure Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Reason */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason {selectedType !== 'Sick' && '(Optional)'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Briefly describe your situation..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Attachment (for Sick) */}
                        {selectedType === 'Sick' && (
                            <div className="space-y-2">
                                <Label>Sick Note (Optional)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                        disabled={isUploading}
                                    />
                                    {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload a medical certificate if available
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Report'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
