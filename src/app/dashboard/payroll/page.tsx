
'use client';

import { useState, useEffect } from 'react';
import { Download, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Employee } from '@/lib/data';
import { PayslipDialog } from './components/payslip-dialog';

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        try {
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                setEmployees(JSON.parse(storedEmployees));
            }
        } catch (error) {
            console.error("Could not get employees from localStorage", error)
        }
    }, []);

    const tableColumns = [
        ...columns.slice(0, columns.length - 1),
        {
            ...columns[columns.length - 1],
            cell: ({ row }: { row: { original: Employee }}) => (
                 <div className="text-right">
                    <PayslipDialog employee={row.original}>
                        <Button variant="ghost" size="sm">
                            <Receipt className="mr-2 h-4 w-4" />
                            Payslip
                        </Button>
                    </PayslipDialog>
                 </div>
            )
        }
    ]

    if (!isClient) {
        return null; // Or a loading spinner
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Payroll</CardTitle>
                        <CardDescription>Review and process employee payroll.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Export CSV
                        </span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <DataTable columns={tableColumns} data={employees} />
                </CardContent>
            </Card>
        </>
    );
}
