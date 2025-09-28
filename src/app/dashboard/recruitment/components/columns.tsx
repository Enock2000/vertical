// src/app/dashboard/recruitment/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, FileText } from "lucide-react"
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
import type { Applicant, ApplicantStatus, JobVacancy } from "@/lib/data"
import { db } from "@/lib/firebase"
import { ref, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { GenerateOfferDialog } from "./generate-offer-dialog"
import type { Department } from "@/lib/data"
import { ViewDocumentsDialog } from "./view-documents-dialog"


const StatusUpdateAction = ({ applicantId, status }: { applicantId: string, status: ApplicantStatus }) => {
    const { toast } = useToast();

    const handleStatusChange = async () => {
        try {
            await update(ref(db, `applicants/${applicantId}`), { status });
            toast({
                title: "Status Updated",
                description: `Applicant status has been changed to "${status}".`,
            });
        } catch (error) {
            console.error(`Failed to update status to ${status}`, error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update applicant status.",
            });
        }
    };

    return (
        <DropdownMenuItem onClick={handleStatusChange}>{status}</DropdownMenuItem>
    );
};


export const columns = (
    vacancy: JobVacancy,
    departments: Department[]
): ColumnDef<Applicant>[] => [
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
      const department = departments.find(d => d.id === vacancy.departmentId);

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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ViewDocumentsDialog applicant={applicant}>
                        <div className="w-full text-left flex items-center">
                            <FileText className="mr-2 h-4 w-4" /> View Documents
                        </div>
                    </ViewDocumentsDialog>
                </DropdownMenuItem>
                {applicant.status === 'Offer' && department && (
                   <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <GenerateOfferDialog applicant={applicant} vacancy={vacancy} department={department}>
                            <div className="w-full text-left">Generate Offer</div>
                        </GenerateOfferDialog>
                   </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                             <StatusUpdateAction applicantId={applicant.id} status="Screening" />
                             <StatusUpdateAction applicantId={applicant.id} status="Interview" />
                             <StatusUpdateAction applicantId={applicant.id} status="Offer" />
                             <StatusUpdateAction applicantId={applicant.id} status="Onboarding" />
                            <DropdownMenuSeparator />
                             <StatusUpdateAction applicantId={applicant.id} status="Hired" />
                             <StatusUpdateAction applicantId={applicant.id} status="Rejected" />
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
