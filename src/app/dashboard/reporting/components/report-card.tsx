// src/app/dashboard/reporting/components/report-card.tsx
'use client';

import * as React from 'react';
import {
    Download,
    FileSpreadsheet,
    FileText,
    Users,
    DollarSign,
    Clock,
    Calendar,
    Briefcase,
    PalmtreeIcon,
    Building2,
    Shield,
    AlertTriangle,
    Loader2,
    FileDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ReportType =
    | 'employee-roster'
    | 'payroll-history'
    | 'attendance-summary'
    | 'daily-attendance'
    | 'leave-report'
    | 'leave-balances'
    | 'department-report'
    | 'audit-log';

interface ReportCardProps {
    type: ReportType;
    title: string;
    description: string;
    recordCount: number;
    onDownloadExcel: () => void;
    onDownloadPdf?: () => void;
    isLoading?: boolean;
    lastGenerated?: Date;
    dateRangeLabel?: string;
}

const reportIcons: Record<ReportType, React.ReactNode> = {
    'employee-roster': <Users className="h-8 w-8" />,
    'payroll-history': <DollarSign className="h-8 w-8" />,
    'attendance-summary': <Clock className="h-8 w-8" />,
    'daily-attendance': <Calendar className="h-8 w-8" />,
    'leave-report': <PalmtreeIcon className="h-8 w-8" />,
    'leave-balances': <Briefcase className="h-8 w-8" />,
    'department-report': <Building2 className="h-8 w-8" />,
    'audit-log': <Shield className="h-8 w-8" />,
};

const reportColors: Record<ReportType, string> = {
    'employee-roster': 'from-blue-500 to-blue-600',
    'payroll-history': 'from-emerald-500 to-emerald-600',
    'attendance-summary': 'from-purple-500 to-purple-600',
    'daily-attendance': 'from-orange-500 to-orange-600',
    'leave-report': 'from-pink-500 to-pink-600',
    'leave-balances': 'from-cyan-500 to-cyan-600',
    'department-report': 'from-indigo-500 to-indigo-600',
    'audit-log': 'from-slate-500 to-slate-600',
};

export function ReportCard({
    type,
    title,
    description,
    recordCount,
    onDownloadExcel,
    onDownloadPdf,
    isLoading = false,
    lastGenerated,
    dateRangeLabel,
}: ReportCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className={cn(
                'h-2 bg-gradient-to-r',
                reportColors[type]
            )} />
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className={cn(
                        'p-3 rounded-lg bg-gradient-to-br text-white',
                        reportColors[type]
                    )}>
                        {reportIcons[type]}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {recordCount} records
                    </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {dateRangeLabel && (
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateRangeLabel}
                    </p>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={onDownloadExcel}
                        disabled={isLoading || recordCount === 0}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                        )}
                        Excel
                    </Button>
                    {onDownloadPdf && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={onDownloadPdf}
                            disabled={isLoading || recordCount === 0}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4" />
                            )}
                            PDF
                        </Button>
                    )}
                </div>

                {lastGenerated && (
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Last generated: {lastGenerated.toLocaleTimeString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// Compact version for smaller displays
export function ReportCardCompact({
    type,
    title,
    recordCount,
    onDownloadExcel,
    isLoading = false,
}: Omit<ReportCardProps, 'description' | 'onDownloadPdf' | 'lastGenerated' | 'dateRangeLabel'>) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn(
                    'p-2 rounded-md bg-gradient-to-br text-white',
                    reportColors[type]
                )}>
                    {React.cloneElement(reportIcons[type] as React.ReactElement, { className: 'h-5 w-5' })}
                </div>
                <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{recordCount} records</p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadExcel}
                disabled={isLoading || recordCount === 0}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
