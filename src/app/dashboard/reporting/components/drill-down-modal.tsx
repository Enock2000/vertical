// src/app/dashboard/analytics/components/drill-down-modal.tsx
'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrillDownModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onExport?: () => void;
    breadcrumbs?: { label: string; onClick?: () => void }[];
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
};

export function DrillDownModal({
    open,
    onClose,
    title,
    subtitle,
    children,
    onExport,
    breadcrumbs,
    size = 'lg',
}: DrillDownModalProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className={cn('p-0', sizeClasses[size])}>
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <span>/</span>}
                                    {crumb.onClick ? (
                                        <button
                                            onClick={crumb.onClick}
                                            className="hover:text-foreground transition-colors"
                                        >
                                            {crumb.label}
                                        </button>
                                    ) : (
                                        <span className="text-foreground">{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">{title}</DialogTitle>
                            {subtitle && (
                                <DialogDescription className="mt-1">
                                    {subtitle}
                                </DialogDescription>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {onExport && (
                                <Button variant="outline" size="sm" onClick={onExport}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6">
                        {children}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// Table for drill-down data
interface DrillDownTableProps<T> {
    data: T[];
    columns: {
        key: keyof T | string;
        header: string;
        render?: (item: T) => React.ReactNode;
        className?: string;
    }[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export function DrillDownTable<T extends { id?: string }>({
    data,
    columns,
    onRowClick,
    emptyMessage = 'No data available',
}: DrillDownTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted/50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className={cn(
                                    'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                                    col.className
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr
                            key={item.id || idx}
                            className={cn(
                                'border-t',
                                onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors'
                            )}
                            onClick={() => onRowClick?.(item)}
                        >
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className={cn('px-4 py-3 text-sm', col.className)}
                                >
                                    {col.render
                                        ? col.render(item)
                                        : String((item as any)[col.key] ?? '-')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
