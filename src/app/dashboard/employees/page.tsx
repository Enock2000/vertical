import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { employees } from "@/lib/data";

export default function EmployeesPage() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>Manage your employees and their details.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Employee
                    </span>
                </Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={employees} />
            </CardContent>
        </Card>
    );
}
