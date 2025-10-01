
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, LogIn, LogOut } from "lucide-react"
import { format, parseISO, differenceInMilliseconds } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AttendanceRecord } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Extends AttendanceRecord to include dailyTargetHours
type EnrichedAttendanceRecord = AttendanceRecord & { 
    dailyTargetHours?: number,
    onClockIn: () => void;
    onClockOut: () => void;
    isSubmitting: boolean;
    currentTime?: Date; // Add currentTime for live updates
};

const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

const isToday = (dateString: string) => {
    return format(new Date(), 'yyyy-MM-dd') === dateString;
}

export const columns: ColumnDef<EnrichedAttendanceRecord>[] = [
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
    cell: ({ row }) => {
        const record = row.original;
        const nameInitial = record.employeeName.split(' ').map(n => n[0]).join('');
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={record.avatar} alt={record.employeeName} />
                    <AvatarFallback>{nameInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{record.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{record.email}</div>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "departmentName",
    header: "Department",
  },
  {
    accessorKey: "checkInTime",
    header: "Check-In",
    cell: ({ row }) => {
        const checkInTime = row.original.checkInTime;
        const status = row.original.status;
        if (status === 'Absent' || !checkInTime) {
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
    id: 'workingHours',
    header: 'Working Hours',
    cell: ({ row }) => {
        const { checkInTime, checkOutTime, status, dailyTargetHours, currentTime } = row.original;
        
        if (status === 'Absent' || !checkInTime) {
            return <div className="text-muted-foreground">-</div>;
        }
        
        const start = parseISO(checkInTime);
        // If clocked out, use checkout time. If not, use current time for live update.
        const end = checkOutTime ? parseISO(checkOutTime) : (currentTime || new Date());
        const diffMs = differenceInMilliseconds(end, start);
        const duration = formatDuration(diffMs);

        if (!dailyTargetHours) {
            return <div>{duration}</div>
        }

        const targetMs = dailyTargetHours * 3600000;
        const deficitMs = targetMs - diffMs;
        
        return (
            <div>
                <span>{duration}</span>
                {checkOutTime && deficitMs > 0 && (
                     <span className="ml-2 text-xs text-destructive">
                        (-{formatDuration(deficitMs)})
                     </span>
                )}
            </div>
        )
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
      return <Badge variant={variant}>{status || 'Not Clocked In'}</Badge>
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const record = row.original;
      const isRecordForToday = isToday(record.date);
      if (!isRecordForToday) {
          return <div className="text-right text-xs text-muted-foreground"></div>
      }

      const hasClockedIn = !!record.checkInTime;
      const hasClockedOut = !!record.checkOutTime;

      return (
        <div className="text-right">
          {!hasClockedIn ? (
            <Button variant="outline" size="sm" onClick={record.onClockIn} disabled={record.isSubmitting}>
              <LogIn className="mr-2 h-4 w-4" /> Clock In
            </Button>
          ) : !hasClockedOut ? (
            <Button variant="outline" size="sm" onClick={record.onClockOut} disabled={record.isSubmitting}>
               <LogOut className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          ) : (
             <span className="text-xs text-muted-foreground">Completed</span>
          )}
        </div>
      );
    },
  },
]
