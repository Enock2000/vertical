// src/app/dashboard/organization/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Role } from "@/lib/data"
import { Badge } from "@/components/ui/badge"


export const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "departmentName",
    header: "Department",
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        if (permissions.length === 0) {
            return <span>No permissions</span>;
        }
        return (
            <div className="flex flex-wrap gap-1">
                {permissions.slice(0, 2).map(permission => (
                    <Badge key={permission} variant="outline">{permission}</Badge>
                ))}
                {permissions.length > 2 && (
                    <Badge variant="outline">+{permissions.length - 2} more</Badge>
                )}
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original

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
                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete Role</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
