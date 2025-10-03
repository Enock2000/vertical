// src/app/dashboard/finance/components/customers-tab.tsx
'use client';

import { useMemo } from 'react';
import type { Customer } from '@/lib/data';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { AddCustomerDialog } from './add-customer-dialog';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerAlert } from './delete-customer-alert';

export function CustomersTab({ customers, onAction }: { customers: Customer[], onAction: () => void }) {
  const columns: ColumnDef<Customer>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Customer Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const customer = row.original;
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <EditCustomerDialog customer={customer} onCustomerUpdated={onAction}>
                                    <div className="w-full">Edit</div>
                                </EditCustomerDialog>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <DeleteCustomerAlert customerId={customer.id} customerName={customer.name} onCustomerDeleted={onAction}>
                                    <div className="w-full">Delete</div>
                                </DeleteCustomerAlert>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    }
  ], [onAction]);

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your customer directory.</CardDescription>
        </div>
        <AddCustomerDialog onCustomerAdded={onAction}>
             <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                    Add Customer
                </span>
            </Button>
        </AddCustomerDialog>
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No customers found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
