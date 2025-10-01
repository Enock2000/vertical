
// src/app/dashboard/reporting/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { File, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadcountChart from "./components/headcount-chart";
import TurnoverChart from "./components/turnover-chart";
import DiversityChart from "./components/diversity-chart";
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { Employee, AuditLog } from '@/lib/data';
import { format } from 'date-fns';
import { useAuth } from '@/app/auth-provider';

const availableReports = [
    { name: 'Employee Roster', description: 'A full list of all active and inactive employees.' },
    { name: 'Payroll History', description: 'A detailed history of all payroll runs.' },
    { name: 'Attendance Summary', description: 'A summary of employee attendance for a selected period.' },
    { name: 'Daily Attendance Status', description: 'Daily breakdown of employees who are Present, Absent, or On Leave.' },
    { name: 'Leave Report', description: 'Details on employees on leave and sick notes submitted.' },
    { name: 'Leave Balances', description: 'Current leave balances for all employees.' },
    { name: 'Department Report', description: 'A list of all departments and the employees within them.' },
    { name: 'Roles Report', description: 'A list of all roles and their assigned permissions.' },
    { name: 'Emergency Alerts', description: 'A log of all triggered emergency alerts.' },
];

export default function ReportingPage() {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const employeesRef = ref(db, 'employees');
        const auditLogsRef = ref(db, `companies/${companyId}/auditLogs`);
        
        let employeesLoaded = false;
        let auditLogsLoaded = false;
        
        const checkLoading = () => {
            if (employeesLoaded && auditLogsLoaded) {
                setLoading(false);
            }
        };

        const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId);
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

        const auditLogsUnsubscribe = onValue(auditLogsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const logs: AuditLog[] = Object.values(data);
                logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setAuditLogs(logs);
            } else {
                setAuditLogs([]);
            }
            auditLogsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (auditLogs): " + error.name);
            auditLogsLoaded = true;
            checkLoading();
        });

        return () => {
            employeesUnsubscribe();
            auditLogsUnsubscribe();
        };
    }, [companyId]);

    return (
        <Tabs defaultValue="overview">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                 <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                    </span>
                </Button>
            </div>
             <TabsContent value="overview" className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Headcount</CardTitle>
                                <CardDescription>Total number of active employees over time.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <HeadcountChart employees={employees} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Turnover Rate</CardTitle>
                                 <CardDescription>Employee turnover analysis for the current year.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TurnoverChart employees={employees} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Diversity Dashboard</CardTitle>
                                <CardDescription>Breakdown of workforce by gender.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <DiversityChart employees={employees} />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="reports">
                <Card>
                    <CardHeader>
                        <CardTitle>Exportable Reports</CardTitle>
                        <CardDescription>Download various reports in CSV or PDF format.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Report Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableReports.map((report) => (
                                    <TableRow key={report.name}>
                                        <TableCell className="font-medium">{report.name}</TableCell>
                                        <TableCell>{report.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" disabled>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="audit">
                 <Card>
                    <CardHeader>
                        <CardTitle>Audit Log</CardTitle>
                        <CardDescription>A log of all significant activities within the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(new Date(log.timestamp), 'MMM d, yyyy - hh:mm:ss a')}</TableCell>
                                            <TableCell>{log.actor}</TableCell>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell>{log.details}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
