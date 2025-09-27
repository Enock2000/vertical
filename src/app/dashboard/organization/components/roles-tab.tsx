// src/app/dashboard/organization/components/roles-tab.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { DataTable } from './data-table';
import { columns } from './columns';
import type { Role, Department } from '@/lib/data';
import { AddRoleDialog } from './add-role-dialog';

interface RolesTabProps {
    roles: Role[];
    departments: Department[];
}

export function RolesTab({ roles, departments }: RolesTabProps) {
    const handleRoleAdded = () => {
        // Realtime listener will update the state
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Roles</CardTitle>
                    <CardDescription>
                        Define roles and assign permissions for your organization.
                    </CardDescription>
                </div>
                <AddRoleDialog departments={departments} onRoleAdded={handleRoleAdded}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Role
                        </span>
                    </Button>
                </AddRoleDialog>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={roles} />
            </CardContent>
        </Card>
    );
}