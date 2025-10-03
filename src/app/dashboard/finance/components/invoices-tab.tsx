// src/app/dashboard/finance/components/invoices-tab.tsx
'use client';

import { useMemo } from 'react';
import type { Invoice, Customer, Product } from '@/lib/data';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function InvoicesTab({ invoices, customers, products }: { invoices: Invoice[], customers: Customer[], products: Product[] }) {
  const columns = useMemo(() => [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
    },
    {
      accessorKey: 'customer.name',
      header: 'Customer',
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue Date',
      cell: ({ row }: any) => format(new Date(row.original.issueDate), 'MMM d, yyyy'),
    },
    {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }: any) => format(new Date(row.original.dueDate), 'MMM d, yyyy'),
    },
    {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }: any) => currencyFormatter.format(row.original.totalAmount),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => <Badge variant={row.original.status === 'Paid' ? 'default' : 'outline'}>{row.original.status}</Badge>,
    },
  ], []);

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Manage your customer invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
