'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Award, CalendarClock } from 'lucide-react';
import type { Employee, Certification } from '@/lib/data';
import { AddCertificationDialog } from './add-certification-dialog';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface CertificationItemProps {
    certification: Certification;
}

function CertificationItem({ certification }: CertificationItemProps) {
    const issueDate = format(new Date(certification.issueDate), 'MMM d, yyyy');
    const expiryDate = certification.expiryDate ? format(new Date(certification.expiryDate), 'MMM d, yyyy') : 'N/A';
    const daysUntilExpiry = certification.expiryDate ? differenceInDays(new Date(certification.expiryDate), new Date()) : null;

    let expiryBadge: React.ReactNode = null;
    if (daysUntilExpiry !== null) {
        if (daysUntilExpiry < 0) {
            expiryBadge = <Badge variant="destructive">Expired</Badge>;
        } else if (daysUntilExpiry <= 30) {
            expiryBadge = <Badge variant="outline">Expires in {daysUntilExpiry} days</Badge>;
        }
    }

    return (
        <div className="border p-4 rounded-md bg-muted/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{certification.name}</p>
                    <p className="text-sm text-muted-foreground">Issued by {certification.issuingBody}</p>
                </div>
                {expiryBadge}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Issued: {issueDate} | Expires: {expiryDate}
            </p>
        </div>
    );
}

interface CertificationsTabProps {
    employees: Employee[];
    allCertifications: Certification[];
}

export function CertificationsTab({ employees, allCertifications }: CertificationsTabProps) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId) || null;
    }, [selectedEmployeeId, employees]);

    const employeeCertifications = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return allCertifications
            .filter(c => c.employeeId === selectedEmployeeId)
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [selectedEmployeeId, allCertifications]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>
                    Track employee certifications and their expiry dates.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Select onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select an employee to view certifications" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedEmployee && (
                         <AddCertificationDialog employee={selectedEmployee}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Certification
                            </Button>
                        </AddCertificationDialog>
                    )}
                </div>
                {selectedEmployeeId ? (
                    employeeCertifications.length > 0 ? (
                        <div className="space-y-4">
                            {employeeCertifications.map(cert => (
                                <CertificationItem key={cert.id} certification={cert} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                            <Award className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No certifications found for {selectedEmployee?.name}.</p>
                            <p className="text-sm text-muted-foreground">Click "Add Certification" to get started.</p>
                        </div>
                    )
                ) : (
                     <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Please select an employee to view their certifications.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
