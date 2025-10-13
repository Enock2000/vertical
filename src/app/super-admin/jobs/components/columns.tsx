
// src/app/super-admin/jobs/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ExternalLink, MoreHorizontal, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JobVacancy } from "@/lib/data"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { db } from "@/lib/firebase"
import { ref, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"

export type EnrichedJob = JobVacancy & { companyName: string; companyId: string };

const handleStatusUpdate = async (companyId: string, jobId: string, status: 'Approved' | 'Rejected', toast: Function) => {
    try {
        await update(ref(db, `companies/${companyId}/jobVacancies/${jobId}`), { status });
        toast({ title: 'Status Updated', description: `Job has been ${status.toLowerCase()}.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Update Failed" });
    }
};

export const columns = (
    handleDelete: (jobs: EnrichedJob[]) => void
): ColumnDef<EnrichedJob>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Job Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "companyName",
    header: "Company",
  },
  {
    accessorKey: "departmentName",
    header: "Department",
  },
  {
    accessorKey: "createdAt",
    header: "Date Posted",
    cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        if (!createdAt) {
            return "-";
        }
        try {
            return format(new Date(createdAt), 'MMM d, yyyy');
        } catch (error) {
            return "Invalid Date";
        }
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        const variant: "default" | "secondary" | "destructive" | "outline" = 
            status === 'Open' || status === 'Approved' ? 'default' :
            status === 'Pending' ? 'outline' :
            'secondary';
        return <Badge variant={variant}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original
      const { toast } = useToast();
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
                     <DropdownMenuItem asChild>
                         <Link href={`/jobs/${job.id}?companyId=${job.companyId}`} target="_blank">
                           <ExternalLink className="mr-2 h-4 w-4"/> View Job
                        </Link>
                    </DropdownMenuItem>
                    {job.status === 'Pending' && (
                         <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(job.companyId, job.id, 'Approved', toast)}>
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(job.companyId, job.id, 'Rejected', toast)} className="text-red-600">
                                <X className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete([job])}
                    >
                        <Trash2 className="mr-2 h-4 w-4"/> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
