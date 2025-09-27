'use client';

import { useState, useEffect } from 'react';
import { Download, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Employee } from '@/lib/data';
import { PayslipDialog } from './components/payslip-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';


export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const unsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed: " + error.name);
            setLoading(false);
        });

        return () => unsubscribe();
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
                    {loading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DataTable columns={tableColumns} data={employees} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
