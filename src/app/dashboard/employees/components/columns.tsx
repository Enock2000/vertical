
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, FileSignature, FileX2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import type { Employee, Department, Bank, Role } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditEmployeeDialog } from "./edit-employee-dialog"
import { DeleteEmployeeAlert } from "./delete-employee-alert"
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { differenceInYears } from "date-fns"
import { PromoteEmployeeDialog } from "./promote-employee-dialog"
import { DemoteAdminDialog } from "./demote-admin-dialog"
import { GenerateContractDialog } from "./generate-contract-dialog"
import { TerminateContractDialog } from "./terminate-contract-dialog"


const handleStatusChange = async (employeeId: string, status: Employee['status']) => {
    try {
        await update(ref(db, `employees/${employeeId}`), { status });
    } catch (error) {
        console.error("Failed to update status", error);
    }
};

export const columns = (departments: Department[], banks: Bank[], roles: Role[], onAction: () => void): ColumnDef<Employee>[] => [
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
    accessorKey: "name",
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
        const employee = row.original;
        const nameInitial = employee.name.split(' ').map(n => n[0]).join('');
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback>{nameInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
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
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => {
        const { dateOfBirth } = row.original;
        if (!dateOfBirth) {
            return <span className="text-muted-foreground">-</span>;
        }
        return <span>{differenceInYears(new Date(), new Date(dateOfBirth))}</span>;
    }
  },
  {
    accessorKey: "departmentName",
    header: "Department",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant: "default" | "secondary" | "destructive" | "outline" = 
        status === 'Active' ? 'default' :
        status === 'Inactive' ? 'secondary' :
        status === 'Suspended' ? 'destructive' : 'outline';
      
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "annualLeaveBalance",
    header: "Leave Balance",
     cell: ({ row }) => {
      const balance = row.original.annualLeaveBalance;
      return <div className="text-center">{balance} days</div>
    }
  },
  {
    accessorKey: "salary",
    header: () => <div className="text-right">Salary</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salary"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

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
                <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(employee.id)}
                >
                Copy employee ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                             <DropdownMenuItem onClick={() => handleStatusChange(employee.id, 'Active')}>Active</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(employee.id, 'On Leave')}>On Leave</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(employee.id, 'Sick')}>Sick</DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleStatusChange(employee.id, 'Suspended')}>Suspend</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(employee.id, 'Inactive')}>Inactive</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                
                {employee.role === 'Admin' ? (
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <DemoteAdminDialog employee={employee} onEmployeeDemoted={onAction}>
                            <div className="w-full text-left">Demote from Admin</div>
                        </DemoteAdminDialog>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <PromoteEmployeeDialog employee={employee} roles={roles} onEmployeePromoted={onAction}>
                             <div className="w-full text-left">Promote to Admin</div>
                        </PromoteEmployeeDialog>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <GenerateContractDialog employee={employee}>
                    <div className="w-full text-left flex items-center">
                        <FileSignature className="mr-2 h-4 w-4" /> Generate Contract
                    </div>
                  </GenerateContractDialog>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <EditEmployeeDialog employee={employee} departments={departments} banks={banks} onEmployeeUpdated={onAction}>
                    <div className="w-full text-left">Edit Profile</div>
                  </EditEmployeeDialog>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-destructive/10">
                    <TerminateContractDialog employee={employee} onContractTerminated={onAction}>
                         <div className="w-full text-left flex items-center">
                            <FileX2 className="mr-2 h-4 w-4"/> Terminate Contract
                        </div>
                    </TerminateContractDialog>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-destructive/10">
                  <DeleteEmployeeAlert employeeId={employee.id} employeeName={employee.name} onEmployeeDeleted={onAction}>
                    <div className="w-full text-left">Delete Employee</div>
                  </DeleteEmployeeAlert>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
