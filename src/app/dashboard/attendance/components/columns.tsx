"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AttendanceRecord } from "@/lib/data"

export const columns: ColumnDef<AttendanceRecord>[] = [
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
    accessorKey: "checkInTime",
    header: "Check-In",
    cell: ({ row }) => {
        const checkInTime = row.original.checkInTime;
        const status = row.original.status;
        if (status === 'Absent') {
            return <div className="text-muted-foreground">-</div>;
        }
        return <div>{format(parseISO(checkInTime), 'hh:mm:ss a')}</div>
    }
  },
  {
    accessorKey: "checkOutTime",
    header: "Check-Out",
    cell: ({ row }) => {
        const checkOutTime = row.original.checkOutTime;
        return checkOutTime ? <div>{format(parseISO(checkOutTime), 'hh:mm:ss a')}</div> : <div className="text-muted-foreground">-</div>
    }
  },
   {
    id: "duration",
    header: "Duration",
     cell: ({ row }) => {
        const { checkInTime, checkOutTime, status } = row.original;
        if (status === 'Absent') {
             return <div className="text-muted-foreground">-</div>;
        }
        if (!checkOutTime) {
            return <div className="text-muted-foreground">In Progress</div>;
        }
        const start = parseISO(checkInTime);
        const end = parseISO(checkOutTime);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return <div>{`${hours}h ${minutes}m`}</div>
    }
   },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant: "default" | "secondary" | "destructive" | "outline" = 
        status === 'Present' ? 'default' :
        status === 'Absent' ? 'destructive' :
        status === 'Auto Clock-out' ? 'outline' :
        'secondary';
      return <Badge variant={variant}>{status}</Badge>
    },
  },
]
