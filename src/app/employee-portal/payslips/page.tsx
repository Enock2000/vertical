
// src/app/employee-portal/payslips/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { PayrollRun, Employee, Company } from '@/lib/data';
import { Loader2, Receipt } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EmployeePayslipDialog } from '../components/employee-payslip-dialog';

export default function PayslipsPage() {
    const { user, companyId, employee, company, loading: authLoading } = useAuth();
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (user && companyId) {
            const runsRef = ref(db, `companies/${companyId}/payrollRuns`);
            const unsubscribe = onValue(runsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const runsList: PayrollRun[] = Object.keys(data).map(key => ({
                        ...data[key],
                        id: key,
                    })).filter(run => run.employees && run.employees[user.uid]) // Filter runs where user was paid
                    .sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
                    setPayrollRuns(runsList);
                } else {
                    setPayrollRuns([]);
                }
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed (payroll runs):", error);
                setLoadingData(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [user, companyId, authLoading]);
    
    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
    });

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!employee) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Payslip History</CardTitle>
                <CardDescription>
                    Access and download your payslips from previous payrolls.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pay Period</TableHead>
                            <TableHead>Net Pay</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payrollRuns.length > 0 ? (
                            payrollRuns.map(run => {
                                const runEmployee = run.employees[user!.uid];
                                return (
                                    <TableRow key={run.id}>
                                        <TableCell>{format(new Date(run.runDate), 'MMMM yyyy')}</TableCell>
                                        <TableCell>{currencyFormatter.format(runEmployee.netPay)}</TableCell>
                                        <TableCell className="text-right">
                                            <EmployeePayslipDialog 
                                                employee={employee} 
                                                payrollDetails={runEmployee}
                                                companyName={company?.name || ''}
                                                payslipDate={new Date(run.runDate)}
                                            >
                                                <Button variant="outline" size="sm">
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                    View Payslip
                                                </Button>
                                            </EmployeePayslipDialog>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No payslip history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
