// src/app/dashboard/reporting/components/date-range-picker.tsx
'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { addDays, addMonths, format, startOfMonth, endOfMonth, startOfYear, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type PresetPeriod = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'ytd' | 'custom';

interface DateRangePickerProps {
    className?: string;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    presets?: boolean;
}

const presetOptions: { label: string; value: PresetPeriod }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this-week' },
    { label: 'Last Week', value: 'last-week' },
    { label: 'This Month', value: 'this-month' },
    { label: 'Last Month', value: 'last-month' },
    { label: 'This Quarter', value: 'this-quarter' },
    { label: 'Last Quarter', value: 'last-quarter' },
    { label: 'Year to Date', value: 'ytd' },
    { label: 'Custom Range', value: 'custom' },
];

export function getPresetDateRange(preset: PresetPeriod): DateRange {
    const today = new Date();

    switch (preset) {
        case 'today':
            return { from: today, to: today };
        case 'yesterday':
            const yesterday = addDays(today, -1);
            return { from: yesterday, to: yesterday };
        case 'this-week':
            const startOfWeek = addDays(today, -today.getDay());
            return { from: startOfWeek, to: today };
        case 'last-week':
            const lastWeekStart = addDays(today, -today.getDay() - 7);
            const lastWeekEnd = addDays(lastWeekStart, 6);
            return { from: lastWeekStart, to: lastWeekEnd };
        case 'this-month':
            return { from: startOfMonth(today), to: endOfMonth(today) };
        case 'last-month':
            const lastMonth = subMonths(today, 1);
            return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        case 'this-quarter':
            return { from: startOfQuarter(today), to: endOfQuarter(today) };
        case 'last-quarter':
            const lastQuarter = subMonths(today, 3);
            return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
        case 'ytd':
            return { from: startOfYear(today), to: today };
        case 'this-year':
            return { from: startOfYear(today), to: today };
        default:
            return { from: startOfMonth(today), to: today };
    }
}

export function DateRangePicker({
    className,
    dateRange,
    onDateRangeChange,
    presets = true,
}: DateRangePickerProps) {
    const [selectedPreset, setSelectedPreset] = React.useState<PresetPeriod>('this-month');

    const handlePresetChange = (preset: PresetPeriod) => {
        setSelectedPreset(preset);
        if (preset !== 'custom') {
            onDateRangeChange(getPresetDateRange(preset));
        }
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {presets && (
                <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetPeriod)}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        {presetOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-[280px] justify-start text-left font-normal',
                            !dateRange && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                                    {format(dateRange.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(dateRange.from, 'LLL dd, y')
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                            onDateRangeChange(range);
                            if (range) setSelectedPreset('custom');
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
