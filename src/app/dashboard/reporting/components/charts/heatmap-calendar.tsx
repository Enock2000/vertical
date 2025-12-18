// src/app/dashboard/analytics/components/charts/heatmap-calendar.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeatmapData {
    date: string; // YYYY-MM-DD
    value: number;
    label?: string;
}

interface HeatmapCalendarProps {
    title?: string;
    description?: string;
    data: HeatmapData[];
    onDayClick?: (date: string, data?: HeatmapData) => void;
    className?: string;
    colorScale?: 'green' | 'blue' | 'red' | 'purple';
    maxValue?: number;
}

const colorScales = {
    green: ['bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500'],
    blue: ['bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500'],
    red: ['bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500'],
    purple: ['bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500'],
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HeatmapCalendar({
    title,
    description,
    data,
    onDayClick,
    className,
    colorScale = 'green',
    maxValue: propMaxValue,
}: HeatmapCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const dataMap = React.useMemo(() => {
        const map: Record<string, HeatmapData> = {};
        data.forEach(d => { map[d.date] = d; });
        return map;
    }, [data]);

    const maxValue = propMaxValue || Math.max(...data.map(d => d.value), 1);
    const colors = colorScales[colorScale];

    const getDayColor = (value: number) => {
        if (value === 0) return 'bg-muted';
        const ratio = value / maxValue;
        if (ratio <= 0.2) return colors[0];
        if (ratio <= 0.4) return colors[1];
        if (ratio <= 0.6) return colors[2];
        if (ratio <= 0.8) return colors[3];
        return colors[4];
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Padding for first week
    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);

    const content = (
        <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs text-muted-foreground py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <TooltipProvider>
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((_, idx) => (
                        <div key={`pad-${idx}`} className="aspect-square" />
                    ))}
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayData = dataMap[dateStr];
                        const value = dayData?.value || 0;

                        return (
                            <Tooltip key={dateStr}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={cn(
                                            'aspect-square rounded-sm flex items-center justify-center text-xs transition-all',
                                            getDayColor(value),
                                            onDayClick && 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1',
                                            value > 0 && 'text-white font-medium'
                                        )}
                                        onClick={() => onDayClick?.(dateStr, dayData)}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        <div className="font-medium">{format(day, 'MMM d, yyyy')}</div>
                                        {dayData ? (
                                            <div>{dayData.label || `Value: ${value}`}</div>
                                        ) : (
                                            <div className="text-muted-foreground">No data</div>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                {colors.map((color, idx) => (
                    <div key={idx} className={cn('w-4 h-4 rounded', color)} />
                ))}
                <span>More</span>
            </div>
        </div>
    );

    if (!title) return <div className={className}>{content}</div>;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}
