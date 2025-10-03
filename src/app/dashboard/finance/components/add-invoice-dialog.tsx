// src/app/dashboard/finance/components/add-invoice-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import type { Customer, Product, Invoice, LineItem } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const lineItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number(),
  total: z.coerce.number(),
});

const formSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer.'),
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(lineItemSchema).min(1, 'You must add at least one line item.'),
});

type AddInvoiceFormValues = z.infer<typeof formSchema>;

interface AddInvoiceDialogProps {
  children: React.ReactNode;
  customers: Customer[];
  products: Product[];
  onInvoiceAdded: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function AddInvoiceDialog({ children, customers, products, onInvoiceAdded }: AddInvoiceDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddInvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      issueDate: new Date(),
      dueDate: addDays(new Date(), 30),
      lineItems: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const totalAmount = form.watch('lineItems').reduce((sum, item) => sum + (item.total || 0), 0);

  async function onSubmit(values: AddInvoiceFormValues) {
    if (!companyId) return;

    const selectedCustomer = customers.find(c => c.id === values.customerId);
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Customer not found.' });
        return;
    }

    setIsLoading(true);
    try {
      const invoicesRef = ref(db, `companies/${companyId}/invoices`);
      const newInvoiceRef = push(invoicesRef);

      const newLineItems: LineItem[] = values.lineItems.map(item => ({
          ...item,
          productName: products.find(p => p.id === item.productId)?.name || 'Unknown Product'
      }));

      const newInvoice: Omit<Invoice, 'id'> = {
        companyId,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customerName: selectedCustomer.name,
        lineItems: newLineItems,
        totalAmount,
        status: 'Draft',
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };
      
      await set(newInvoiceRef, { ...newInvoice, id: newInvoiceRef.key });

      onInvoiceAdded();
      setOpen(false);
      form.reset();
      toast({
        title: 'Invoice Created',
        description: `Draft invoice ${newInvoice.invoiceNumber} has been created.`,
      });
    } catch (error: any) {
        console.error('Error adding invoice:', error);
        toast({ variant: 'destructive', title: 'Failed to create invoice' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new invoice.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                        <SelectContent><ScrollArea className="h-40">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</ScrollArea></SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Issue Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Separator />
            <div>
                <h3 className="text-lg font-medium mb-2">Line Items</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <Select
                                        onValueChange={(productId) => {
                                            const product = products.find(p => p.id === productId);
                                            if (product) {
                                                update(index, { ...field, productId, unitPrice: product.price, total: product.price * field.quantity });
                                            }
                                        }}
                                        defaultValue={field.productId}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                                        <SelectContent><ScrollArea className="h-40">{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</ScrollArea></SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        defaultValue={field.quantity}
                                        onChange={(e) => {
                                            const quantity = parseInt(e.target.value) || 0;
                                            update(index, { ...field, quantity, total: (field.unitPrice || 0) * quantity });
                                        }}
                                    />
                                </TableCell>
                                <TableCell>{currencyFormatter.format(field.unitPrice || 0)}</TableCell>
                                <TableCell>{currencyFormatter.format(field.total || 0)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, total: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                </Button>
            </div>
             <Separator />
             <div className="flex justify-end text-lg font-bold">
                Total: {currencyFormatter.format(totalAmount)}
             </div>

            <DialogFooter className="sticky bottom-0 bg-background py-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save as Draft'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
