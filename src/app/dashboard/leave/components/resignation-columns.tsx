// src/app/dashboard/leave/components/resignation-columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle2, MoreHorizontal, Hourglass, RotateCcw } from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResignationRequest } from "@/lib/data"

const StatusIcon = ({ status }: { status: ResignationRequest['status'] }) => {
    switch (status) {
        case 'Approved':
            return <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />;
        case 'Withdrawn':
            return <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" />;
        case 'Pending':
            return <Hourglass className="mr-2 h-4 w-4 text-yellow-500" />;
        default:
            return null;
    }
}

export const resignationColumns = (
    handleStatusUpdate: (id: string, status: 'Approved' | 'Withdrawn') => void
): ColumnDef<ResignationRequest>[] => [
  {
    accessorKey: "employeeName",
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
  },
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
    cell: ({ row }) => format(new Date(row.original.submissionDate), "MMM d, yyyy"),
  },
  {
    accessorKey: "resignationDate",
    header: "Requested Last Day",
    cell: ({ row }) => format(new Date(row.original.resignationDate), "MMM d, yyyy"),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.reason}</div>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ResignationRequest['status'];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === 'Approved') variant = 'default';
      if (status === 'Withdrawn') variant = 'outline';

      return (
        <Badge variant={variant} className="capitalize flex items-center w-fit">
            <StatusIcon status={status} />
            {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const request = row.original

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
                {request.status === 'Pending' && (
                    <>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'Approved')}>
                            Approve Resignation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'Withdrawn')}>
                            Mark as Withdrawn
                        </DropdownMenuItem>
                    </>
                )}
                 {request.status !== 'Pending' && (
                    <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                )}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
