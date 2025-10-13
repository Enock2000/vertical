

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
import type { Applicant, ApplicantStatus, JobVacancy, OnboardingTask } from "@/lib/data"
import { defaultOnboardingTasks } from "@/lib/data"
import { db, auth } from "@/lib/firebase"
import { ref, update, push, get } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { GenerateOfferDialog } from "./generate-offer-dialog"
import type { Department } from "@/lib/data"
import { ViewDocumentsDialog } from "./view-documents-dialog"
import { useAuth } from "@/app/auth-provider"
import { sendPasswordResetEmail } from "firebase/auth"


const StatusUpdateAction = ({ applicantId, status, onHired }: { applicantId: string, status: ApplicantStatus, onHired: (email: string) => void }) => {
    const { companyId } = useAuth();
    const { toast } = useToast();

    const handleStatusChange = async () => {
        if (!companyId) return;
        try {
            const updates: { [key: string]: any } = { status };
            if (status === 'Onboarding') {
                const initialTasks: OnboardingTask[] = defaultOnboardingTasks.map(task => ({
                    id: push(ref(db)).key!,
                    title: task.title,
                    completed: false,
                    dueDate: null,
                }));
                updates['onboardingTasks'] = initialTasks;
            }
             if (status === 'Hired') {
                updates['hiredAt'] = new Date().toISOString();
                const applicantSnap = await get(ref(db, `companies/${companyId}/applicants/${applicantId}`));
                if (applicantSnap.exists()) {
                    onHired(applicantSnap.val().email);
                }
            }

            await update(ref(db, `companies/${companyId}/applicants/${applicantId}`), updates);
            if (status !== 'Hired') {
                toast({
                    title: "Status Updated",
                    description: `Applicant status has been changed to "${status}".`,
                });
            }
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
): ColumnDef<Applicant>[] => {
    const { toast } = useToast();
    
    const handleHired = async (email: string, applicantId: string) => {
        const employeeRef = ref(db, `employees/${applicantId}`);
        const employeeSnap = await get(employeeRef);
        if (employeeSnap.exists()) {
            const employeeUpdates: Partial<any> = {
                role: vacancy.title,
                status: 'Active',
                departmentId: vacancy.departmentId,
                departmentName: vacancy.departmentName,
                joinDate: new Date().toISOString(),
            };
            await update(employeeRef, employeeUpdates);
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Applicant Hired!",
                description: `${employeeSnap.val().name} is now an employee. An email has been sent for them to set their password.`
            });
        }
    };
    
    return [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Applicant
          <ArrowUpDown className="mr-2 h-4 w-4" />
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
                {(applicant.resumeUrl || applicant.answers) && (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ViewDocumentsDialog applicant={applicant} vacancy={vacancy}>
                            <div className="w-full text-left flex items-center">
                                <FileText className="mr-2 h-4 w-4" /> View Application
                            </div>
                        </ViewDocumentsDialog>
                    </DropdownMenuItem>
                )}
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
                             <StatusUpdateAction applicantId={applicant.id} status="Screening" onHired={() => {}} />
                             <StatusUpdateAction applicantId={applicant.id} status="Interview" onHired={() => {}} />
                             <StatusUpdateAction applicantId={applicant.id} status="Offer" onHired={() => {}} />
                             <StatusUpdateAction applicantId={applicant.id} status="Onboarding" onHired={() => {}} />
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleHired(applicant.email, applicant.id)} className="text-green-600 focus:text-green-600">
                                 Mark as Hired
                             </DropdownMenuItem>
                             <StatusUpdateAction applicantId={applicant.id} status="Rejected" onHired={() => {}} />
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
}
