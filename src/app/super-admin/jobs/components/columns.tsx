// src/app/super-admin/jobs/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JobVacancy } from "@/lib/data"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type EnrichedJob = JobVacancy & { companyName: string };

export const columns: ColumnDef<EnrichedJob>[] = [
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
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        const variant: "default" | "secondary" | "destructive" | "outline" = 
            status === 'Open' ? 'default' : 'secondary';
        return <Badge variant={variant}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original
      return (
        <div className="text-right">
           <Button asChild variant="outline" size="sm">
                <Link href={`/jobs/${job.id}?companyId=${job.companyId}`} target="_blank">
                    View
                </Link>
           </Button>
        </div>
      )
    },
  },
]
