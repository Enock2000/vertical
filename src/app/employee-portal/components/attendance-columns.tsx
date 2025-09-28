'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO, differenceInMilliseconds } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { AttendanceRecord } from '@/lib/data';

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

export const columns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.date;
      return <div>{format(new Date(date), 'MMMM d, yyyy')}</div>;
    },
  },
  {
    accessorKey: 'checkInTime',
    header: 'Check-In',
    cell: ({ row }) => {
      const { checkInTime, status } = row.original;
      if (status === 'Absent') {
        return <div className="text-muted-foreground">-</div>;
      }
      return <div>{format(parseISO(checkInTime), 'hh:mm:ss a')}</div>;
    },
  },
  {
    accessorKey: 'checkOutTime',
    header: 'Check-Out',
    cell: ({ row }) => {
      const { checkOutTime } = row.original;
      return checkOutTime ? <div>{format(parseISO(checkOutTime), 'hh:mm:ss a')}</div> : <div className="text-muted-foreground">-</div>;
    },
  },
  {
    id: 'workingHours',
    header: 'Working Hours',
    cell: ({ row }) => {
      const { checkInTime, checkOutTime, status } = row.original;

      if (status === 'Absent' || !checkOutTime) {
        return <div className="text-muted-foreground">-</div>;
      }

      const start = parseISO(checkInTime);
      const end = parseISO(checkOutTime);
      const diffMs = differenceInMilliseconds(end, start);
      return <div>{formatDuration(diffMs)}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Present' ? 'default' :
        status === 'Absent' ? 'destructive' :
        status === 'Auto Clock-out' ? 'outline' :
        'secondary';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
];
