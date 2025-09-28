// src/app/dashboard/payment-methods/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Employee, Bank } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditPaymentMethodDialog } from "./edit-payment-method-dialog"

export const columns = (banks: Bank[], onAction: () => void): ColumnDef<Employee>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const employee = row.original;
        const nameInitial = employee.name.split(' ').map(n => n[0]).join('');
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback>{nameInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "bankName",
    header: "Bank Name",
    cell: ({ row }) => row.original.bankName || <span className="text-muted-foreground">Not set</span>,
  },
  {
    accessorKey: "accountNumber",
    header: "Account Number",
    cell: ({ row }) => row.original.accountNumber || <span className="text-muted-foreground">Not set</span>,
  },
  {
    accessorKey: "branchCode",
    header: "Branch Code",
    cell: ({ row }) => row.original.branchCode || <span className="text-muted-foreground">Not set</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

      return (
        <div className="text-right">
            <EditPaymentMethodDialog employee={employee} banks={banks} onPaymentMethodUpdated={onAction}>
                <Button variant="outline" size="sm">
                    Edit Details
                </Button>
            </EditPaymentMethodDialog>
        </div>
      )
    },
  },
]
