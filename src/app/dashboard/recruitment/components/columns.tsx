// src/app/dashboard/recruitment/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Applicant, ApplicantStatus } from "@/lib/data"

// Dummy handler for now
const handleStatusChange = (applicantId: string, status: ApplicantStatus) => {
    console.log(`Changing status of ${applicantId} to ${status}`);
    // In a real app, you'd call a server action or API here
    // e.g., update(ref(db, `applicants/${applicantId}`), { status });
}

export const columns = (): ColumnDef<Applicant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Applicant
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const applicant = row.original;
        return (
            <div>
                <div className="font-medium">{applicant.name}</div>
                <div className="text-sm text-muted-foreground">{applicant.email}</div>
            </div>
        )
    }
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "appliedAt",
    header: "Applied Date",
    cell: ({ row }) => {
        const date = row.original.appliedAt;
        return <div>{format(new Date(date), 'MMM d, yyyy')}</div>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline">{status}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const applicant = row.original;

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
                <DropdownMenuItem>View Resume</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                             <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'Screening')}>Screening</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'Interview')}>Interview</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'Offer')}>Offer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'Hired')}>Hired</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'Rejected')}>Rejected</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
