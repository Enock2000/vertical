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
import { EditRoleDialog } from "./edit-role-dialog"
import { DeleteRoleAlert } from "./delete-role-alert"
import type { Department } from "@/lib/data"


export const columns = (
    departments: Department[],
    onRoleUpdated: () => void,
    onRoleDeleted: () => void
): ColumnDef<Role>[] => [
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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <EditRoleDialog role={role} departments={departments} onRoleUpdated={onRoleUpdated}>
                        <div className="w-full text-left">Edit Role</div>
                    </EditRoleDialog>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <DeleteRoleAlert roleId={role.id} roleName={role.name} onRoleDeleted={onRoleDeleted}>
                         <div className="w-full text-left">Delete Role</div>
                    </DeleteRoleAlert>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
