
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Receipt, Loader2, PlayCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Employee, calculatePayroll, PayrollConfig, PayrollDetails, PayrollRun } from '@/lib/data';
import { PayslipDialog } from './components/payslip-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { runPayroll } from '@/ai/flows/run-payroll-flow';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/app/auth-provider';
import { ViewPayrollRunDialog } from './components/view-payroll-run-dialog';

export default function PayrollPage() {
    const { companyId, employee: adminEmployee, company } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const configRef = ref(db, `companies/${companyId}/payrollConfig`);
        const runsRef = ref(db, `companies/${companyId}/payrollRuns`);

        let employeesLoaded = false;
        let configLoaded = false;
        let runsLoaded = false;

        const checkLoading = () => {
            if (employeesLoaded && configLoaded && runsLoaded) {
                setLoading(false);
            }
        }

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.status === 'Active');
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            employeesLoaded = true;
            checkLoading();
        });

        const configUnsubscribe = onValue(configRef, (snapshot) => {
            setPayrollConfig(snapshot.val());
            configLoaded = true;
            checkLoading();
        });

        const runsUnsubscribe = onValue(runsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const runsList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                })).sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
                setPayrollRuns(runsList);
            } else {
                setPayrollRuns([]);
            }
            runsLoaded = true;
            checkLoading();
        });

        return () => {
            employeesUnsubscribe();
            configUnsubscribe();
            runsUnsubscribe();
        };
    }, [companyId]);

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


    const totalPayrollAmount = useMemo(() => {
        return Array.from(payrollDetailsMap.values()).reduce((sum, details) => sum + details.netPay, 0);
    }, [payrollDetailsMap]);
    
    const handleRunPayroll = async () => {
        if (!companyId || !adminEmployee) return;
        setIsProcessing(true);
        try {
            const result = await runPayroll(companyId, adminEmployee.name);
            if(result.success && result.achFileContent) {
                toast({
                    title: "Payroll Processed",
                    description: "The ACH file has been generated for download."
                });
                // Trigger download
                const link = document.createElement("a");
                link.href = result.achFileContent;
                const fileName = `ACH-PAYROLL-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Payroll Failed",
                    description: result.message,
                });
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "An Error Occurred",
                description: error.message || "Could not process payroll.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const tableColumnsDef = columns(getPayrollDetails);

    const tableColumns = [
        ...tableColumnsDef.slice(0, tableColumnsDef.length - 1),
        {
            ...tableColumnsDef[tableColumnsDef.length - 1],
            cell: ({ row }: { row: { original: Employee }}) => {
                const payrollDetails = getPayrollDetails(row.original);
                 return (
                     <div className="text-right">
                        <PayslipDialog employee={row.original} payrollDetails={payrollDetails} companyName={company?.name || ''} payslipDate={new Date()}>
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

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ZMW",
    });

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Run Payroll</CardTitle>
                        <CardDescription>Review and process payroll for the current period.</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" className="gap-1" disabled={employees.length === 0 || isProcessing}>
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                                    Run Payroll
                                </span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Payroll Run</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to process payroll for <strong>{employees.length}</strong> active employees, totaling approximately <strong>{currencyFormatter.format(totalPayrollAmount)}</strong>.
                                This will generate an ACH file for bank transfers. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRunPayroll} disabled={isProcessing}>
                                {isProcessing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</>
                                ) : "Yes, Run Payroll"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Payroll History</CardTitle>
                    <CardDescription>Review past payroll runs and download ACH files.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : payrollRuns.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Run Date</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {payrollRuns.map(run => (
                                    <TableRow key={run.id}>
                                        <TableCell>{format(new Date(run.runDate), 'MMMM d, yyyy - hh:mm a')}</TableCell>
                                        <TableCell>{run.employeeCount}</TableCell>
                                        <TableCell>{currencyFormatter.format(run.totalAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <ViewPayrollRunDialog payrollRun={run} allEmployees={employees} companyName={company?.name || ''} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No payroll history found.
                        </div>
                    )}
                </CardContent>
             </Card>
        </div>
    );
}
