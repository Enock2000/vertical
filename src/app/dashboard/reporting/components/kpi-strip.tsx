// src/app/dashboard/reporting/components/kpi-strip.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Clock,
    Palmtree,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';

interface KPIData {
    id: string;
    label: string;
    value: number | string;
    format?: 'number' | 'currency' | 'percentage';
    prefix?: string;
    suffix?: string;
    trend?: {
        value: number;
        direction: 'up' | 'down' | 'neutral';
        label?: string;
    };
    icon?: React.ElementType;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
    onClick?: () => void;
    sparklineData?: number[];
}

interface KPIStripProps {
    kpis: KPIData[];
    className?: string;
    loading?: boolean;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
    const [count, setCount] = React.useState(0);
    const countRef = React.useRef(0);
    const startTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            // Ease out cubic
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            countRef.current = Math.floor(easeOutCubic * target);
            setCount(countRef.current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        startTimeRef.current = null;
        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
}

// Mini sparkline component
function Sparkline({ data, color = 'primary' }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const width = 60;
    const height = 24;
    const padding = 2;

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-60">
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/20',
    },
    green: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20',
    },
    purple: {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/20',
    },
    orange: {
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/20',
    },
    pink: {
        bg: 'bg-pink-500/10 dark:bg-pink-500/20',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-500/20',
    },
    cyan: {
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500/20',
    },
};

function KPICard({ kpi, loading }: { kpi: KPIData; loading?: boolean }) {
    const numericValue = typeof kpi.value === 'number' ? kpi.value : 0;
    const animatedValue = useAnimatedCounter(numericValue, 800);
    const colors = colorClasses[kpi.color || 'blue'];
    const Icon = kpi.icon || Users;

    const formatValue = (val: number) => {
        if (kpi.format === 'currency') {
            return new Intl.NumberFormat('en-ZM', {
                style: 'currency',
                currency: 'ZMW',
                notation: val >= 1000000 ? 'compact' : 'standard',
                maximumFractionDigits: val >= 1000000 ? 1 : 0
            }).format(val);
        }
        if (kpi.format === 'percentage') {
            return `${val.toFixed(1)}%`;
        }
        return new Intl.NumberFormat().format(val);
    };

    const displayValue = typeof kpi.value === 'string'
        ? kpi.value
        : formatValue(animatedValue);

    const TrendIcon = kpi.trend?.direction === 'up'
        ? ArrowUpRight
        : kpi.trend?.direction === 'down'
            ? ArrowDownRight
            : Minus;

    const trendColorClass = kpi.trend?.direction === 'up'
        ? 'text-emerald-500'
        : kpi.trend?.direction === 'down'
            ? 'text-red-500'
            : 'text-muted-foreground';

    if (loading) {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-muted" />
                            <div className="h-4 w-16 rounded bg-muted" />
                        </div>
                        <div className="h-8 w-24 rounded bg-muted" />
                        <div className="h-4 w-32 rounded bg-muted" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all duration-200 group",
                "hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
                kpi.onClick && "cursor-pointer"
            )}
            onClick={kpi.onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2.5 rounded-xl", colors.bg)}>
                        <Icon className={cn("h-5 w-5", colors.text)} />
                    </div>
                    {kpi.sparklineData && (
                        <div className={colors.text}>
                            <Sparkline data={kpi.sparklineData} />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        {kpi.prefix && <span className="text-muted-foreground text-sm">{kpi.prefix}</span>}
                        <span className="text-2xl font-bold tracking-tight">{displayValue}</span>
                        {kpi.suffix && <span className="text-muted-foreground text-sm">{kpi.suffix}</span>}
                    </div>

                    <p className="text-sm text-muted-foreground">{kpi.label}</p>

                    {kpi.trend && (
                        <div className="flex items-center gap-1.5 pt-1">
                            <div className={cn(
                                "flex items-center gap-0.5 text-xs font-medium",
                                trendColorClass
                            )}>
                                <TrendIcon className="h-3.5 w-3.5" />
                                <span>{Math.abs(kpi.trend.value)}%</span>
                            </div>
                            {kpi.trend.label && (
                                <span className="text-xs text-muted-foreground">{kpi.trend.label}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Hover indicator */}
                {kpi.onClick && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                )}
            </CardContent>
        </Card>
    );
}

export function KPIStrip({ kpis, className, loading }: KPIStripProps) {
    return (
        <div className={cn(
            "grid gap-4",
            kpis.length <= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
            className
        )}>
            {kpis.map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} loading={loading} />
            ))}
        </div>
    );
}

// Preset KPI configurations
export const defaultKPIs = {
    totalEmployees: (count: number, trend?: number): KPIData => ({
        id: 'total-employees',
        label: 'Total Employees',
        value: count,
        format: 'number',
        icon: Users,
        color: 'blue',
        trend: trend !== undefined ? {
            value: trend,
            direction: trend >= 0 ? 'up' : 'down',
            label: 'vs last month'
        } : undefined,
    }),

    attendanceRate: (rate: number, trend?: number): KPIData => ({
        id: 'attendance-rate',
        label: 'Attendance Rate',
        value: rate,
        format: 'percentage',
        icon: Clock,
        color: 'green',
        trend: trend !== undefined ? {
            value: trend,
            direction: trend >= 0 ? 'up' : 'down',
            label: 'vs last week'
        } : undefined,
    }),

    monthlyPayroll: (amount: number, trend?: number): KPIData => ({
        id: 'monthly-payroll',
        label: 'Monthly Payroll',
        value: amount,
        format: 'currency',
        icon: DollarSign,
        color: 'purple',
        trend: trend !== undefined ? {
            value: trend,
            direction: trend >= 0 ? 'up' : 'down',
            label: 'vs last month'
        } : undefined,
    }),

    activeLeave: (count: number, pending?: number): KPIData => ({
        id: 'active-leave',
        label: 'On Leave Today',
        value: count,
        format: 'number',
        icon: Palmtree,
        color: 'orange',
        trend: pending ? {
            value: pending,
            direction: 'neutral',
            label: 'pending approval'
        } : undefined,
    }),
};
