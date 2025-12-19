// src/app/dashboard/reporting/components/report-filters.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X, Filter, Search, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

export interface FilterValue {
    id: string;
    label: string;
    value: string | string[] | DateRange | undefined;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'search';
}

export interface FilterConfig {
    id: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'search';
    options?: { value: string; label: string }[];
    placeholder?: string;
    defaultValue?: string | string[] | DateRange;
}

interface ReportFiltersProps {
    filters: FilterConfig[];
    values: Record<string, any>;
    onChange: (id: string, value: any) => void;
    onReset?: () => void;
    onApply?: () => void;
    className?: string;
    showApplyButton?: boolean;
    showResetButton?: boolean;
}

// Filter Chip Component
function FilterChip({
    label,
    value,
    onRemove
}: {
    label: string;
    value: string;
    onRemove: () => void;
}) {
    return (
        <Badge
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-1 text-xs font-normal hover:bg-secondary/80"
        >
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium">{value}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
            >
                <X className="h-3 w-3" />
            </button>
        </Badge>
    );
}

// Date Range Picker
function DateRangePicker({
    value,
    onChange,
    placeholder = "Select date range"
}: {
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.from ? (
                        value.to ? (
                            <>
                                {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(value.from, "LLL dd, y")
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={value?.from}
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}

// Single Date Picker
function SingleDatePicker({
    value,
    onChange,
    placeholder = "Select date"
}: {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export function ReportFilters({
    filters,
    values,
    onChange,
    onReset,
    onApply,
    className,
    showApplyButton = false,
    showResetButton = true,
}: ReportFiltersProps) {
    const activeFilters = React.useMemo(() => {
        return filters.filter(filter => {
            const value = values[filter.id];
            if (value === undefined || value === null || value === '') return false;
            if (Array.isArray(value) && value.length === 0) return false;
            if (filter.type === 'daterange' && (!value?.from && !value?.to)) return false;
            return true;
        });
    }, [filters, values]);

    const getDisplayValue = (filter: FilterConfig): string => {
        const value = values[filter.id];
        if (!value) return '';

        switch (filter.type) {
            case 'select':
                const option = filter.options?.find(o => o.value === value);
                return option?.label || value;
            case 'multiselect':
                if (Array.isArray(value)) {
                    return value.map(v =>
                        filter.options?.find(o => o.value === v)?.label || v
                    ).join(', ');
                }
                return '';
            case 'date':
                return value instanceof Date ? format(value, 'PP') : '';
            case 'daterange':
                if (value?.from) {
                    return value.to
                        ? `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`
                        : format(value.from, 'PP');
                }
                return '';
            case 'search':
                return value;
            default:
                return '';
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="flex-1 flex items-center gap-2 flex-wrap">
                    {filters.map((filter) => (
                        <div key={filter.id} className="min-w-[160px] max-w-[240px]">
                            {filter.type === 'select' && (
                                <Select
                                    value={values[filter.id] || ''}
                                    onValueChange={(value) => onChange(filter.id, value)}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder={filter.placeholder || filter.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filter.options?.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {filter.type === 'search' && (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder={filter.placeholder || "Search..."}
                                        value={values[filter.id] || ''}
                                        onChange={(e) => onChange(filter.id, e.target.value)}
                                        className="h-9 pl-8 text-sm"
                                    />
                                </div>
                            )}

                            {filter.type === 'date' && (
                                <SingleDatePicker
                                    value={values[filter.id]}
                                    onChange={(date) => onChange(filter.id, date)}
                                    placeholder={filter.placeholder || filter.label}
                                />
                            )}

                            {filter.type === 'daterange' && (
                                <DateRangePicker
                                    value={values[filter.id]}
                                    onChange={(range) => onChange(filter.id, range)}
                                    placeholder={filter.placeholder || filter.label}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {showResetButton && activeFilters.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-1.5 text-muted-foreground"
                            onClick={onReset}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </Button>
                    )}

                    {showApplyButton && (
                        <Button size="sm" className="h-9" onClick={onApply}>
                            Apply
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Active:</span>
                    {activeFilters.map((filter) => (
                        <FilterChip
                            key={filter.id}
                            label={filter.label}
                            value={getDisplayValue(filter)}
                            onRemove={() => onChange(filter.id, undefined)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Preset filter configurations
export const commonFilters = {
    department: (departments: { id: string; name: string }[]): FilterConfig => ({
        id: 'department',
        label: 'Department',
        type: 'select',
        placeholder: 'All Departments',
        options: [
            { value: 'all', label: 'All Departments' },
            ...departments.map(d => ({ value: d.id, label: d.name }))
        ],
    }),

    dateRange: (): FilterConfig => ({
        id: 'dateRange',
        label: 'Date Range',
        type: 'daterange',
        placeholder: 'Select period',
    }),

    status: (statuses: string[]): FilterConfig => ({
        id: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'All Statuses',
        options: [
            { value: 'all', label: 'All Statuses' },
            ...statuses.map(s => ({ value: s.toLowerCase(), label: s }))
        ],
    }),

    search: (): FilterConfig => ({
        id: 'search',
        label: 'Search',
        type: 'search',
        placeholder: 'Search...',
    }),
};
