"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Employee, PayrollDetails } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
});

export const columns = (getPayrollDetails: (employee: Employee) => PayrollDetails | null): ColumnDef<Employee>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => {
        const employee = row.original;
        const nameInitial = employee.name.split(' ').map(n => n[0]).join('');
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback>{nameInitial}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{employee.name}</div>
            </div>
        )
    }
  },
  {
    id: "grossPay",
    header: () => <div className="text-right">Gross Pay</div>,
    cell: ({ row }) => {
        const payroll = getPayrollDetails(row.original);
        if (!payroll) return <div className="text-right">-</div>;
        return <div className="text-right">{currencyFormatter.format(payroll.grossPay)}</div>
    },
  },
  {
    id: "deductions",
    header: () => <div className="text-right">Deductions</div>,
    cell: ({ row }) => {
        const payroll = getPayrollDetails(row.original);
        if (!payroll) return <div className="text-right">-</div>;
        return <div className="text-right">{currencyFormatter.format(payroll.totalDeductions)}</div>
    },
  },
  {
    id: "netPay",
    header: () => <div className="text-right font-bold">Net Pay</div>,
    cell: ({ row }) => {
      const payroll = getPayrollDetails(row.original);
      if (!payroll) return <div className="text-right font-bold">-</div>;
      return <div className="text-right font-bold">{currencyFormatter.format(payroll.netPay)}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>Generate Payslip</DropdownMenuItem>
                <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Employee Details</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
