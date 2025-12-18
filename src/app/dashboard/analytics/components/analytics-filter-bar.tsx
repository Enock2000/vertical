// src/app/dashboard/analytics/components/analytics-filter-bar.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DateRangePicker, getPresetDateRange } from '@/app/dashboard/reporting/components/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Department, Employee } from '@/lib/data';

export interface AnalyticsFilters {
    dateRange: DateRange | undefined;
    department: string | 'all';
    branch: string | 'all';
    status: string | 'all';
}

interface AnalyticsFilterBarProps {
    filters: AnalyticsFilters;
    onFiltersChange: (filters: AnalyticsFilters) => void;
    departments: Department[];
    branches?: { id: string; name: string }[];
    statusOptions?: { value: string; label: string }[];
    className?: string;
}

export function AnalyticsFilterBar({
    filters,
    onFiltersChange,
    departments,
    branches = [],
    statusOptions = [],
    className,
}: AnalyticsFilterBarProps) {
    const activeFilterCount = [
        filters.department !== 'all',
        filters.branch !== 'all',
        filters.status !== 'all',
    ].filter(Boolean).length;

    const clearFilters = () => {
        onFiltersChange({
            dateRange: getPresetDateRange('this-month'),
            department: 'all',
            branch: 'all',
            status: 'all',
        });
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-3', className)}>
            {/* Date Range */}
            <DateRangePicker
                dateRange={filters.dateRange}
                onDateRangeChange={(range) =>
                    onFiltersChange({ ...filters, dateRange: range })
                }
            />

            {/* Department Filter */}
            <Select
                value={filters.department}
                onValueChange={(value) =>
                    onFiltersChange({ ...filters, department: value })
                }
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Branch Filter */}
            {branches.length > 0 && (
                <Select
                    value={filters.branch}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, branch: value })
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Status Filter */}
            {statusOptions.length > 0 && (
                <Select
                    value={filters.status}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, status: value })
                    }
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Active Filter Badge */}
            {activeFilterCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                    <Filter className="h-3 w-3" />
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </Badge>
            )}

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}

// Export default filters
export function getDefaultFilters(): AnalyticsFilters {
    return {
        dateRange: getPresetDateRange('this-month'),
        department: 'all',
        branch: 'all',
        status: 'all',
    };
}
