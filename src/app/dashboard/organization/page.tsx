import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function OrganizationPage() {
    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Organizational Structure</CardTitle>
                        <CardDescription>
                            Define and manage roles, departments, and reporting lines.
                        </CardDescription>
                    </div>
                     <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Role
                        </span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <div className="text-center">
                            <p className="text-muted-foreground">Organizational chart and role management coming soon.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
