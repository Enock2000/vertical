import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ComplianceForm from "./components/compliance-form";

export default function CompliancePage() {
    return (
        <div className="mx-auto max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>Compliance Advisor</CardTitle>
                    <CardDescription>
                        Get AI-driven recommendations for compliance and legal mandates based on employee location and contract details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ComplianceForm />
                </CardContent>
            </Card>
        </div>
    )
}
