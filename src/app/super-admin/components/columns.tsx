
// src/app/super-admin/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Company, Employee } from "@/lib/data"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { ref, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"

export type EnrichedCompany = Company & { employeeCount: number };

const handleStatusUpdate = async (companyId: string, employeeId: string, status: 'Active' | 'Rejected', toast: Function) => {
    try {
        await update(ref(db, `companies/${companyId}`), { status });

        if (status === 'Active') {
             await update(ref(db, `employees/${employeeId}`), { status: 'Active' });
        }
        
        toast({
            title: `Company ${status}`,
            description: `The company registration has been ${status.toLowerCase()}.`
        });

    } catch (error) {
        console.error("Failed to update status", error);
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update company status.",
        });
    }
}

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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        const variant: "default" | "secondary" | "destructive" = 
            status === 'Active' ? 'default' :
            status === 'Rejected' ? 'destructive' :
            'secondary';
        return <Badge variant={variant}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original
      const { toast } = useToast()

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
                {company.status === 'Pending' && (
                    <>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(company.id, company.id, 'Active', toast)}>
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(company.id, company.id, 'Rejected', toast)} className="text-red-600">
                            Reject
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
