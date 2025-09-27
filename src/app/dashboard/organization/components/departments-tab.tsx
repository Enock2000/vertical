// src/app/dashboard/organization/components/departments-tab.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddDepartmentDialog } from './add-department-dialog';
import type { Department } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

interface DepartmentsTabProps {
    departments: Department[];
}

export function DepartmentsTab({ departments }: DepartmentsTabProps) {
    const handleDepartmentAdded = () => {
        // Realtime listener will update the state
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>
                        Manage the departments within your organization.
                    </CardDescription>
                </div>
                <AddDepartmentDialog onDepartmentAdded={handleDepartmentAdded}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Department
                        </span>
                    </Button>
                </AddDepartmentDialog>
            </CardHeader>
            <CardContent>
                {departments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {departments.map(dept => (
                            <Badge key={dept.id} variant="secondary" className="text-lg py-1 px-3">
                                {dept.name}
                            </Badge>
                        ))}
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