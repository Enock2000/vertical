// src/app/dashboard/organization/components/departments-tab.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { AddDepartmentDialog } from './add-department-dialog';
import type { Department } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditDepartmentDialog } from './edit-department-dialog';
import { DeleteDepartmentAlert } from './delete-department-alert';

interface DepartmentsTabProps {
    departments: Department[];
    onAction: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
});


export function DepartmentsTab({ departments, onAction }: DepartmentsTabProps) {

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                        Manage the departments and their salary ranges within your organization.
                    </CardDescription>
                </div>
                <AddDepartmentDialog onDepartmentAdded={onAction}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                            Add Department
                        </span>
                    </Button>
                </AddDepartmentDialog>
            </CardHeader>
            <CardContent>
                {departments.length > 0 ? (
                    <div className="border rounded-md">
                        <ul className="divide-y">
                           {departments.map(dept => (
                               <li key={dept.id} className="flex items-center justify-between p-4">
                                   <div>
                                       <p className="font-semibold">{dept.name}</p>
                                       <p className="text-sm text-muted-foreground">
                                           Salary Range: {currencyFormatter.format(dept.minSalary)} - {currencyFormatter.format(dept.maxSalary)}
                                       </p>
                                   </div>
                                   <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <EditDepartmentDialog department={dept} onDepartmentUpdated={onAction}>
                                                    <div className="w-full text-left">Edit</div>
                                                </EditDepartmentDialog>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                <DeleteDepartmentAlert departmentId={dept.id} departmentName={dept.name} onDepartmentDeleted={onAction}>
                                                    <div className="w-full text-left">Delete</div>
                                                </DeleteDepartmentAlert>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                   </DropdownMenu>
                               </li>
                           ))}
                        </ul>
                    </div>
                ) : (
                     <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No departments found. Add one to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
