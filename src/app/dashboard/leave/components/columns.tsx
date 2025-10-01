"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle2, XCircle, MoreHorizontal, Hourglass, FileText } from "lucide-react"
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
import { LeaveRequest } from "@/lib/data"
import Link from "next/link"

const StatusIcon = ({ status }: { status: LeaveRequest['status'] }) => {
    switch (status) {
        case 'Approved':
            return <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />;
        case 'Rejected':
            return <XCircle className="mr-2 h-4 w-4 text-red-500" />;
        case 'Pending':
            return <Hourglass className="mr-2 h-4 w-4 text-yellow-500" />;
        default:
            return null;
    }
}

export const columns = (
    handleStatusUpdate: (id: string, status: 'Approved' | 'Rejected') => void
): ColumnDef<LeaveRequest>[] => [
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
    accessorKey: "leaveType",
    header: "Leave Type",
    cell: ({ row }) => {
        return <Badge variant="outline">{row.original.leaveType}</Badge>
    }
  },
   {
    accessorKey: "dateRange",
    header: "Dates",
    cell: ({ row }) => {
        const { startDate, endDate } = row.original;
        const start = format(new Date(startDate), "MMM d, yyyy");
        const end = format(new Date(endDate), "MMM d, yyyy");
        return <div>{`${start} - ${end}`}</div>
    }
   },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as LeaveRequest['status'];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status === 'Approved') variant = 'default';
      if (status === 'Rejected') variant = 'destructive';

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
                {request.sickNoteUrl && (
                  <DropdownMenuItem asChild>
                      <Link href={request.sickNoteUrl} target="_blank" rel="noopener noreferrer">
                         <FileText className="mr-2 h-4 w-4" />
                         View Sick Note
                      </Link>
                  </DropdownMenuItem>
                )}
                {request.status === 'Pending' && (
                    <>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'Approved')}>
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'Rejected')}>
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
