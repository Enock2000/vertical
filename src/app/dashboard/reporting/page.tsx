// src/app/dashboard/reporting/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadcountChart from "./components/headcount-chart";
import TurnoverChart from "./components/turnover-chart";
import DiversityChart from "./components/diversity-chart";
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { Employee } from '@/lib/data';

export default function ReportingPage() {
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
                        <p>Report generation functionality coming soon.</p>
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
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
