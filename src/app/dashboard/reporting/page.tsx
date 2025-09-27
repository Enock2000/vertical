import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadcountChart from "./components/headcount-chart";
import TurnoverChart from "./components/turnover-chart";
import DiversityChart from "./components/diversity-chart";

const auditLogs = [
    {
      id: "LOG-001",
      user: "Admin",
      action: "Updated employee profile: John Doe",
      timestamp: new Date().toISOString(),
    },
    {
      id: "LOG-002",
      user: "Admin",
      action: "Processed payroll for October 2023",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "LOG-003",
      user: "Jane Smith",
      action: "Submitted leave request",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

export default function ReportingPage() {
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Headcount</CardTitle>
                            <CardDescription>Total number of active employees over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <HeadcountChart />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Turnover Rate</CardTitle>
                             <CardDescription>Employee turnover analysis for the current year.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TurnoverChart />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Diversity Dashboard</CardTitle>
                            <CardDescription>Breakdown of workforce by gender.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <DiversityChart />
                        </CardContent>
                    </Card>
                </div>
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
                                {auditLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.user}</TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
