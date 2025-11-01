
// src/app/dashboard/finance/components/sales-report-tab.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SalesDailyReport, SalesReportTransaction, Branch } from '@/lib/data';
import { submitSalesReport } from '@/ai/flows/submit-sales-report-flow';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

const salesReportFormSchema = z.object({
  reportDate: z.date(),
  transactions: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    paymentMethod: z.enum(['Cash', 'Card', 'Transfer', 'Other']),
  })).min(1, "At least one transaction is required."),
});

type SalesReportFormValues = z.infer<typeof salesReportFormSchema>;

function SalesReportForm({ branches, onReportSubmitted }: { branches: Branch[], onReportSubmitted: () => void }) {
  const { employee, companyId } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<SalesReportFormValues>({
    resolver: zodResolver(salesReportFormSchema),
    defaultValues: {
      reportDate: new Date(),
      transactions: [{ description: '', amount: 0, paymentMethod: 'Cash' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'transactions',
  });
  
  const totalSales = form.watch('transactions').reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const onSubmit = async (values: SalesReportFormValues) => {
    if (!employee || !companyId || !employee.branchId) {
        toast({ variant: 'destructive', title: "Error", description: "You are not assigned to a branch." });
        return;
    }

    const branch = branches.find(b => b.id === employee.branchId);
    if (!branch) {
         toast({ variant: 'destructive', title: "Error", description: "Could not find your assigned branch." });
        return;
    }

    setIsLoading(true);
    try {
      const result = await submitSalesReport({
        ...values,
        reportDate: values.reportDate.toISOString(),
        companyId,
        branchId: branch.id,
        branchName: branch.name,
        submittedByEmployeeId: employee.id,
        submittedByEmployeeName: employee.name,
      });

      if (result.success) {
        toast({ title: "Report Submitted", description: result.message });
        form.reset();
        onReportSubmitted();
      } else {
        toast({ variant: 'destructive', title: "Submission Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Daily Sales Report</CardTitle>
        <CardDescription>Enter all sales transactions for the selected date. This will be sent to the finance team.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reportDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Report Date</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Transactions</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField control={form.control} name={`transactions.${index}.description`} render={({ field }) => <FormItem className="flex-1"><FormControl><Input placeholder="Item/Service sold" {...field} /></FormControl></FormItem>} />
                  <FormField control={form.control} name={`transactions.${index}.amount`} render={({ field }) => <FormItem><FormControl><Input type="number" placeholder="Amount" {...field} className="w-28" /></FormControl></FormItem>} />
                  <FormField control={form.control} name={`transactions.${index}.paymentMethod`} render={({ field }) => <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-32"><SelectValue placeholder="Method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem><SelectItem value="Transfer">Transfer</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></FormItem>} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
               <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', amount: 0, paymentMethod: 'Cash' })}><PlusCircle className="mr-2 h-4 w-4" />Add Transaction</Button>
               <FormMessage>{form.formState.errors.transactions?.root?.message}</FormMessage>
            </div>

            <div className="text-right text-lg font-bold">
                Total Sales: {currencyFormatter.format(totalSales)}
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Submit Report
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export function SalesReportTab({ salesReports }: { salesReports: SalesDailyReport[] }) {
    const { employee } = useAuth();
    
    // In a real app with many branches, we'd fetch these. For now, assume it's available.
    const userBranches: Branch[] = employee?.branchId ? [{id: employee.branchId, name: employee.branchName || 'My Branch', companyId: employee.companyId, location: ''}] : [];

    const isFinanceManager = employee?.role === 'Admin' || employee?.permissions?.includes('finance');

    const reportsToShow = isFinanceManager
        ? salesReports
        : salesReports.filter(r => r.branchId === employee?.branchId);

    return (
        <div className="space-y-6">
            {!isFinanceManager && <SalesReportForm branches={userBranches} onReportSubmitted={() => {}} />}
            <Card>
                <CardHeader>
                    <CardTitle>Submitted Sales Reports</CardTitle>
                    <CardDescription>{isFinanceManager ? "All submitted reports from all branches." : "Your branch's submitted reports."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report Date</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Submitted By</TableHead>
                                <TableHead>Total Sales</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportsToShow.length > 0 ? (
                                reportsToShow.map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell>{format(new Date(report.reportDate), 'PPP')}</TableCell>
                                        <TableCell>{report.branchName}</TableCell>
                                        <TableCell>{report.submittedByEmployeeName}</TableCell>
                                        <TableCell>{currencyFormatter.format(report.totalSales)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No sales reports found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
