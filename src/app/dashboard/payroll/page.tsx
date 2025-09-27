'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Employee, calculatePayroll, PayrollConfig, PayrollDetails } from '@/lib/data';
import { PayslipDialog } from './components/payslip-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';


export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, 'payrollConfig');

        let employeesLoaded = false;
        let configLoaded = false;

        const checkLoading = () => {
            if (employeesLoaded && configLoaded) {
                setLoading(false);
            }
        }

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
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
            employeesLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (employees): " + error.name);
            employeesLoaded = true;
            checkLoading();
        });

        const configUnsubscribe = onValue(configRef, (snapshot) => {
            setPayrollConfig(snapshot.val());
            configLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (payrollConfig): " + error.name);
            configLoaded = true;
            checkLoading();
        });

        return () => {
            employeesUnsubscribe();
            configUnsubscribe();
        };
    }, []);

    const payrollDetailsMap = useMemo(() => {
        if (!payrollConfig || employees.length === 0) {
            return new Map<string, PayrollDetails>();
        }
        
        const map = new Map<string, PayrollDetails>();
        employees.forEach(employee => {
            const details = calculatePayroll(employee, payrollConfig);
            map.set(employee.id, details);
        });
        return map;

    }, [employees, payrollConfig]);

    const getPayrollDetails = useCallback((employee: Employee) => {
        return payrollDetailsMap.get(employee.id) || null;
    }, [payrollDetailsMap]);


    const tableColumnsDef = columns(getPayrollDetails);

    const tableColumns = [
        ...tableColumnsDef.slice(0, tableColumnsDef.length - 1),
        {
            ...tableColumnsDef[tableColumnsDef.length - 1],
            cell: ({ row }: { row: { original: Employee }}) => {
                const payrollDetails = getPayrollDetails(row.original);
                 return (
                     <div className="text-right">
                        <PayslipDialog employee={row.original} payrollDetails={payrollDetails}>
                            <Button variant="ghost" size="sm">
                                <Receipt className="mr-2 h-4 w-4" />
                                Payslip
                            </Button>
                        </PayslipDialog>
                     </div>
                 )
            }
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
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
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
