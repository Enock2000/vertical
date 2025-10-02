// src/app/employee-portal/components/leave-columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { LeaveRequest } from '@/lib/data';
import { CheckCircle2, Hourglass, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: 'leaveType',
    header: 'Leave Type',
    cell: ({ row }) => {
        return <Badge variant="outline">{row.original.leaveType}</Badge>
    }
  },
  {
    accessorKey: 'dateRange',
    header: 'Dates',
    cell: ({ row }) => {
        const { startDate, endDate } = row.original;
        const start = format(new Date(startDate), "MMM d, yyyy");
        const end = format(new Date(endDate), "MMM d, yyyy");
        return <div>{`${start} - ${end}`}</div>
    }
   },
   {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({row}) => <div className="truncate max-w-xs">{row.original.reason}</div>
   },
  {
    accessorKey: 'status',
    header: 'Status',
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
    id: "sickNote",
    header: "Sick Note",
    cell: ({ row }) => {
      const { sickNoteUrl } = row.original;
      if (!sickNoteUrl) {
          return <div className="text-muted-foreground">-</div>;
      }
      return (
        <Button variant="outline" size="sm" asChild>
            <Link href={sickNoteUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" /> View
            </Link>
        </Button>
      )
    }
  }
];
