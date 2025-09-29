// src/app/super-admin/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Company } from "@/lib/data"
import { format } from "date-fns"

export type EnrichedCompany = Company & { employeeCount: number };

export const columns: ColumnDef<EnrichedCompany>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "contactName",
    header: "Admin Contact",
  },
  {
    accessorKey: "adminEmail",
    header: "Admin Email",
  },
  {
    accessorKey: "employeeCount",
    header: "Employees",
    cell: ({ row }) => <div className="text-center">{row.original.employeeCount}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Registration Date",
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    id: "actions",
    cell: () => {
      return (
        <div className="text-right">
            <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
      )
    },
  },
]
