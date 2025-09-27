import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { employees } from "@/lib/data";

export default function PayrollPage() {
    return (
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
                <DataTable columns={columns} data={employees} />
            </CardContent>
        </Card>
    );
}
