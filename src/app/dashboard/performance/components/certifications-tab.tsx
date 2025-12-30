'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PlusCircle,
    Award,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Building,
    FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee, Certification } from '@/lib/data';
import { AddCertificationDialog } from './add-certification-dialog';
import { format, differenceInDays, isPast } from 'date-fns';

interface CertificationCardProps {
    certification: Certification;
}

function CertificationCard({ certification }: CertificationCardProps) {
    const issueDate = format(new Date(certification.issueDate), 'MMM d, yyyy');
    const expiryDate = certification.expiryDate ? format(new Date(certification.expiryDate), 'MMM d, yyyy') : null;
    const daysUntilExpiry = certification.expiryDate ? differenceInDays(new Date(certification.expiryDate), new Date()) : null;

    const getExpiryStatus = () => {
        if (daysUntilExpiry === null) return { label: 'No Expiry', variant: 'secondary' as const, color: 'text-gray-600' };
        if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'destructive' as const, color: 'text-red-600' };
        if (daysUntilExpiry <= 30) return { label: `${daysUntilExpiry}d left`, variant: 'outline' as const, color: 'text-orange-600' };
        if (daysUntilExpiry <= 90) return { label: `${daysUntilExpiry}d left`, variant: 'secondary' as const, color: 'text-yellow-600' };
        return { label: 'Active', variant: 'secondary' as const, color: 'text-green-600' };
    };

    const expiryStatus = getExpiryStatus();
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

    return (
        <div className={cn(
            "border rounded-lg p-4 hover:shadow-md transition-all",
            isExpired ? "bg-red-50/50 border-red-200" : "bg-card"
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-shrink-0">
                    <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        isExpired ? "bg-red-100" : "bg-primary/10"
                    )}>
                        <Award className={cn("h-6 w-6", isExpired ? "text-red-600" : "text-primary")} />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="font-semibold">{certification.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {certification.issuingBody}
                            </p>
                        </div>
                        <Badge variant={expiryStatus.variant} className={cn("flex-shrink-0", expiryStatus.color)}>
                            {expiryStatus.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            Issued: {issueDate}
                        </div>
                        {expiryDate && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {expiryDate}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CertificationStatsProps {
    certifications: Certification[];
}

function CertificationStats({ certifications }: CertificationStatsProps) {
    const stats = useMemo(() => {
        const total = certifications.length;
        const expired = certifications.filter(c => c.expiryDate && isPast(new Date(c.expiryDate))).length;
        const expiringSoon = certifications.filter(c => {
            if (!c.expiryDate) return false;
            const days = differenceInDays(new Date(c.expiryDate), new Date());
            return days >= 0 && days <= 30;
        }).length;
        const active = total - expired;

        return { total, expired, expiringSoon, active };
    }, [certifications]);

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
            </div>
        </div>
    );
}

interface CertificationsTabProps {
    employees: Employee[];
    allCertifications: Certification[];
}

export function CertificationsTab({ employees, allCertifications }: CertificationsTabProps) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
        employees.length > 0 ? employees[0].id : null
    );
    const [activeView, setActiveView] = useState<'active' | 'expired' | 'all'>('all');

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId) || null;
    }, [selectedEmployeeId, employees]);

    const employeeCertifications = useMemo(() => {
        if (!selectedEmployeeId) return [];
        let certs = allCertifications
            .filter(c => c.employeeId === selectedEmployeeId)
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

        if (activeView === 'active') {
            certs = certs.filter(c => !c.expiryDate || !isPast(new Date(c.expiryDate)));
        } else if (activeView === 'expired') {
            certs = certs.filter(c => c.expiryDate && isPast(new Date(c.expiryDate)));
        }

        return certs;
    }, [selectedEmployeeId, allCertifications, activeView]);

    // Get employee's certification count for summary
    const employeeCertCount = useMemo(() => {
        const counts: Record<string, number> = {};
        employees.forEach(e => {
            counts[e.id] = allCertifications.filter(c => c.employeeId === e.id).length;
        });
        return counts;
    }, [employees, allCertifications]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certifications
                        </CardTitle>
                        <CardDescription>
                            Track employee certifications and their expiry dates.
                        </CardDescription>
                    </div>
                    {selectedEmployee && (
                        <AddCertificationDialog employee={selectedEmployee}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Certification
                            </Button>
                        </AddCertificationDialog>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Employee Selector */}
                <div className="flex items-center gap-4">
                    <Select value={selectedEmployeeId || undefined} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={employee.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {employee.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{employee.name}</span>
                                        <Badge variant="outline" className="ml-auto text-xs">
                                            {employeeCertCount[employee.id] || 0} certs
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedEmployee && (
                    <>
                        {/* Stats */}
                        <CertificationStats certifications={allCertifications.filter(c => c.employeeId === selectedEmployeeId)} />

                        {/* View Filter */}
                        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="expired">Expired</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Certifications List */}
                        {employeeCertifications.length > 0 ? (
                            <div className="space-y-3">
                                {employeeCertifications.map(cert => (
                                    <CertificationCard key={cert.id} certification={cert} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-center">
                                <Award className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                    {activeView === 'all'
                                        ? `No certifications for ${selectedEmployee.name}.`
                                        : `No ${activeView} certifications.`}
                                </p>
                                {activeView === 'all' && (
                                    <p className="text-sm text-muted-foreground">Click "Add Certification" to get started.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
