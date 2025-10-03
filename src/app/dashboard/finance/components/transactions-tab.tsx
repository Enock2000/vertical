// src/app/dashboard/finance/components/transactions-tab.tsx
'use client';

import { useMemo } from 'react';
import type { Transaction } from '@/lib/data';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ZMW',
});

export function TransactionsTab({ transactions }: { transactions: Transaction[] }) {
  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.date), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: any) => <Badge variant={row.original.type === 'Income' ? 'default' : 'secondary'}>{row.original.type}</Badge>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => {
        const amount = row.original.amount;
        const type = row.original.type;
        const formattedAmount = currencyFormatter.format(amount);
        return <span className={type === 'Expense' ? 'text-destructive' : 'text-green-600'}>{formattedAmount}</span>
      },
    },
  ], []);

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>View your financial ledger.</CardDescription>
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
