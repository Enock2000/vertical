// src/app/employee-portal/components/employee-leave-request-dialog.tsx
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/data';
import { requestLeave } from '@/ai/flows/request-leave-flow';
import { Loader2, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  leaveType: z.enum(['Annual', 'Sick', 'Unpaid', 'Maternity']),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }).refine(data => data.from && data.to, {
    message: "Please select a date range.",
    path: ["from"]
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters.'),
  sickNote: z.any().optional(),
}).refine(data => {
    if (data.leaveType === 'Sick' && !data.sickNote) {
        return false;
    }
    return true;
}, {
    message: "A sick note is required for sick leave.",
    path: ["sickNote"],
});

type RequestLeaveFormValues = z.infer<typeof formSchema>;

interface EmployeeLeaveRequestDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

export function EmployeeLeaveRequestDialog({
  children,
  employee,
}: EmployeeLeaveRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<RequestLeaveFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: 'Annual',
      reason: '',
    },
  });

  const leaveType = form.watch('leaveType');

  async function onSubmit(values: RequestLeaveFormValues) {
    if (!formRef.current) return;
    setIsLoading(true);
    
    const formData = new FormData(formRef.current);
    formData.append('employeeId', employee.id);
    formData.append('employeeName', employee.name);
    formData.append('companyId', employee.companyId);
    formData.append('startDate', values.dateRange.from.toISOString());
    formData.append('endDate', values.dateRange.to.toISOString());
    formData.append('leaveType', values.leaveType);
    formData.append('reason', values.reason);

    try {
      const result = await requestLeave(formData);
      
      if (result.success) {
        setIsLoading(false);
        setOpen(false);
        form.reset();
        setFileName('');
        toast({
          title: 'Leave Request Submitted',
          description: `Your request has been submitted for approval.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        setIsLoading(false);
      }

    } catch (error) {
       console.error("Error submitting leave request:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to submit leave request.",
        })
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit a new leave request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Leave Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, y")} -{" "}
                                {format(field.value.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={{ from: field.value?.from, to: field.value?.to }}
                        onSelect={(range) => field.onChange(range as { from: Date; to: Date })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for leave..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {leaveType === 'Sick' && (
                <FormField
                    control={form.control}
                    name="sickNote"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sick Note</FormLabel>
                            <FormControl>
                                <>
                                 <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {fileName || 'Upload your sick note'}
                                 </Button>
                                <Input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    name="sickNote"
                                    className="hidden" 
                                    onChange={(e) => {
                                        field.onChange(e.target.files ? e.target.files[0] : null);
                                        setFileName(e.target.files?.[0]?.name || '');
                                    }}
                                />
                                </>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
            )}

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
