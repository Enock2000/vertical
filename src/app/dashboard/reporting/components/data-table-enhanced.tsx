// src/app/dashboard/reporting/components/data-table-enhanced.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Search,
    Download,
    Eye,
    ArrowUpRight,
    Columns3,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Column<T> {
    id: string;
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    filterable?: boolean;
    visible?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, row: T) => React.ReactNode;
}

export interface TableAction<T> {
    id: string;
    label: string;
    icon?: React.ElementType;
    onClick: (row: T) => void;
    variant?: 'default' | 'ghost' | 'destructive';
}

interface EnhancedDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: TableAction<T>[];
    keyField: keyof T;
    title?: string;
    description?: string;
    loading?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    showSearch?: boolean;
    showColumnToggle?: boolean;
    showExport?: boolean;
    showPagination?: boolean;
    onRowClick?: (row: T) => void;
    onExport?: () => void;
    className?: string;
    emptyMessage?: string;
    stickyHeader?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function EnhancedDataTable<T extends Record<string, any>>({
    data,
    columns: initialColumns,
    actions,
    keyField,
    title,
    description,
    loading = false,
    searchPlaceholder = 'Search...',
    pageSize = 10,
    showSearch = true,
    showColumnToggle = true,
    showExport = true,
    showPagination = true,
    onRowClick,
    onExport,
    className,
    emptyMessage = 'No data found.',
    stickyHeader = true,
}: EnhancedDataTableProps<T>) {
    const [columns, setColumns] = React.useState(
        initialColumns.map(col => ({ ...col, visible: col.visible !== false }))
    );
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = React.useState(1);

    // Filter data based on search term
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;

        const term = searchTerm.toLowerCase();
        return data.filter(row => {
            return columns.some(col => {
                if (!col.filterable) return false;
                const value = typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : row[col.accessor];
                return String(value).toLowerCase().includes(term);
            });
        });
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = React.useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredData;

        const column = columns.find(col => col.id === sortColumn);
        if (!column) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = typeof column.accessor === 'function'
                ? column.accessor(a)
                : a[column.accessor];
            const bValue = typeof column.accessor === 'function'
                ? column.accessor(b)
                : b[column.accessor];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortColumn, sortDirection, columns]);

    // Paginate data
    const paginatedData = React.useMemo(() => {
        if (!showPagination) return sortedData;

        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, showPagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (columnId: string) => {
        const column = columns.find(col => col.id === columnId);
        if (!column?.sortable) return;

        if (sortColumn === columnId) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
    };

    const toggleColumnVisibility = (columnId: string) => {
        setColumns(prev => prev.map(col =>
            col.id === columnId ? { ...col, visible: !col.visible } : col
        ));
    };

    const visibleColumns = columns.filter(col => col.visible);

    const getSortIcon = (columnId: string) => {
        if (sortColumn !== columnId) return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
        return <ChevronDown className="h-4 w-4" />;
    };

    const getCellValue = (row: T, column: Column<T>) => {
        const value = typeof column.accessor === 'function'
            ? column.accessor(row)
            : row[column.accessor];

        if (column.render) {
            return column.render(value, row);
        }

        return value;
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>

                <div className="flex items-center gap-2">
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-8 w-[200px] h-9"
                            />
                        </div>
                    )}

                    {showColumnToggle && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                                    <Columns3 className="h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {columns.map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={column.visible}
                                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                                    >
                                        {column.header}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {showExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5"
                            onClick={onExport}
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
                <div className={cn(
                    "overflow-auto",
                    stickyHeader && "max-h-[600px]"
                )}>
                    <Table>
                        <TableHeader className={cn(stickyHeader && "sticky top-0 bg-muted/95 backdrop-blur-sm z-10")}>
                            <TableRow>
                                {visibleColumns.map((column) => (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            column.sortable && "cursor-pointer hover:bg-muted/50 select-none",
                                            column.align === 'center' && "text-center",
                                            column.align === 'right' && "text-right"
                                        )}
                                        style={{ width: column.width }}
                                        onClick={() => handleSort(column.id)}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            column.align === 'center' && "justify-center",
                                            column.align === 'right' && "justify-end"
                                        )}>
                                            {column.header}
                                            {column.sortable && getSortIcon(column.id)}
                                        </div>
                                    </TableHead>
                                ))}
                                {actions && actions.length > 0 && (
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length + (actions ? 1 : 0)} className="h-32">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length + (actions ? 1 : 0)} className="h-32 text-center">
                                        <p className="text-muted-foreground">{emptyMessage}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((row) => (
                                    <TableRow
                                        key={String(row[keyField])}
                                        className={cn(
                                            onRowClick && "cursor-pointer hover:bg-muted/50",
                                            "transition-colors"
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {visibleColumns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                className={cn(
                                                    column.align === 'center' && "text-center",
                                                    column.align === 'right' && "text-right"
                                                )}
                                            >
                                                {getCellValue(row, column)}
                                            </TableCell>
                                        ))}
                                        {actions && actions.length > 0 && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {actions.map((action) => (
                                                        <Button
                                                            key={action.id}
                                                            variant={action.variant || 'ghost'}
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                action.onClick(row);
                                                            }}
                                                            title={action.label}
                                                        >
                                                            {action.icon && <action.icon className="h-4 w-4" />}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (totalPages <= 7) return true;
                                if (page === 1 || page === totalPages) return true;
                                if (Math.abs(page - currentPage) <= 1) return true;
                                return false;
                            })
                            .map((page, index, array) => {
                                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                return (
                                    <React.Fragment key={page}>
                                        {showEllipsis && (
                                            <span className="px-2 text-muted-foreground">...</span>
                                        )}
                                        <Button
                                            variant={currentPage === page ? 'default' : 'outline'}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    </React.Fragment>
                                );
                            })}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Preset cell renderers
export const cellRenderers = {
    avatar: (name: string, image?: string) => (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{name}</span>
        </div>
    ),

    status: (status: string, variant?: 'default' | 'secondary' | 'destructive' | 'outline') => (
        <Badge variant={variant || 'secondary'}>{status}</Badge>
    ),

    currency: (amount: number, currency = 'ZMW') => (
        <span className="font-medium">
            {new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(amount)}
        </span>
    ),

    date: (date: string | Date) => (
        <span>{new Date(date).toLocaleDateString('en-ZM', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })}</span>
    ),

    percentage: (value: number) => (
        <span className={cn(
            "font-medium",
            value >= 80 && "text-emerald-600",
            value < 80 && value >= 50 && "text-amber-600",
            value < 50 && "text-red-600"
        )}>
            {value.toFixed(1)}%
        </span>
    ),
};
