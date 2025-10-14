// src/app/super-admin/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Company, SubscriptionPlan } from "@/lib/data"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { ref, update, remove, get } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ViewCompanyProfileDialog } from "./view-company-profile-dialog"
import { ChangeSubscriptionDialog } from "./change-subscription-dialog"
import { sendCompanyApprovedEmail } from "@/lib/email"

export type EnrichedCompany = Company & { employeeCount: number };

const handleStatusUpdate = async (company: Company, status: Company['status'], toast: Function) => {
    try {
        await update(ref(db, `companies/${company.id}`), { status });

        // Also update the primary admin's status if they are being activated for the first time
        if (status === 'Active') {
             await update(ref(db, `employees/${company.id}`), { status: 'Active' });
             const companySnap = await get(ref(db, `companies/${company.id}`));
             await sendCompanyApprovedEmail(companySnap.val());
        }
        
        toast({
            title: `Company ${status}`,
            description: `The company registration has been ${status.toLowerCase()}.`
        });

    } catch (error) {
        console.error("Failed to update status", error);
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update company status.",
        });
    }
}

const DeleteCompanyAlert = ({ company, onConfirm, onCancel }: { company: Company, onConfirm: () => void, onCancel: () => void }) => {
    return (
        <AlertDialog open={true} onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the company <strong>{company.name}</strong> and all associated data, including employees, payroll, and settings.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">Yes, delete company</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


export const columns = (subscriptionPlans: SubscriptionPlan[]): ColumnDef<EnrichedCompany>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "contactName",
    header: "Admin Contact",
  },
  {
    accessorKey: "adminEmail",
    header: "Admin Email",
  },
  {
    accessorKey: "employeeCount",
    header: "Employees",
    cell: ({ row }) => <div className="text-center">{row.original.employeeCount}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Registration Date",
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        const variant: "default" | "secondary" | "destructive" | "outline" = 
            status === 'Active' ? 'default' :
            status === 'Rejected' ? 'destructive' :
            status === 'Suspended' ? 'outline' :
            'secondary';
        return <Badge variant={variant}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original
      const { toast } = useToast()
      const [isDeleting, setIsDeleting] = useState(false);

      const handleDelete = async () => {
        try {
            await remove(ref(db, `companies/${company.id}`));
            // In a real app, you would also trigger a function to delete all associated employees, auth users, etc.
            toast({
                title: "Company Deleted",
                description: `${company.name} has been permanently deleted.`
            });
        } catch (error) {
            console.error("Failed to delete company", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "Could not delete company.",
            });
        } finally {
            setIsDeleting(false);
        }
      };


      return (
        <div className="text-right">
            {isDeleting && <DeleteCompanyAlert company={company} onConfirm={handleDelete} onCancel={() => setIsDeleting(false)} />}
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
                    <ViewCompanyProfileDialog company={company}>
                        <div className="w-full text-left">View Profile</div>
                    </ViewCompanyProfileDialog>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ChangeSubscriptionDialog company={company} plans={subscriptionPlans}>
                        <div className="w-full text-left">Change Subscription</div>
                    </ChangeSubscriptionDialog>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {company.status === 'Pending' && (
                    <>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(company, 'Active', toast)}>
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(company, 'Rejected', toast)}>
                            Reject
                        </DropdownMenuItem>
                    </>
                )}
                 {company.status === 'Active' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(company, 'Suspended', toast)}>
                        Suspend
                    </DropdownMenuItem>
                )}
                 {(company.status === 'Suspended' || company.status === 'Rejected') && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(company, 'Active', toast)}>
                        Activate
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleting(true)}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
