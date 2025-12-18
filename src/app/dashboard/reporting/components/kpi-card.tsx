// src/app/dashboard/analytics/components/kpi-card.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: number;
    changeLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    sparklineData?: number[];
    onClick?: () => void;
    className?: string;
    color?: 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const colorClasses = {
    default: 'from-slate-500 to-slate-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
};

export function KPICard({
    title,
    value,
    subtitle,
    change,
    changeLabel,
    trend = 'neutral',
    icon,
    sparklineData,
    onClick,
    className,
    color = 'default',
}: KPICardProps) {
    const isClickable = !!onClick;

    // Convert sparklineData to chart format
    const chartData = sparklineData?.map((val, idx) => ({ value: val, index: idx }));

    return (
        <Card
            className={cn(
                'overflow-hidden transition-all duration-200',
                isClickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5',
                className
            )}
            onClick={onClick}
        >
            <div className={cn('h-1 bg-gradient-to-r', colorClasses[color])} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && (
                    <div className={cn(
                        'p-2 rounded-lg bg-gradient-to-br text-white',
                        colorClasses[color]
                    )}>
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-bold">{value}</div>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {change !== undefined && (
                            <div className={cn(
                                'flex items-center gap-1 text-xs mt-1',
                                trend === 'up' && 'text-emerald-600',
                                trend === 'down' && 'text-red-600',
                                trend === 'neutral' && 'text-muted-foreground'
                            )}>
                                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                                {trend === 'neutral' && <Minus className="h-3 w-3" />}
                                <span>{change > 0 ? '+' : ''}{change}%</span>
                                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
                            </div>
                        )}
                    </div>

                    {/* Sparkline */}
                    {chartData && chartData.length > 0 && (
                        <div className="w-20 h-12">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={trend === 'down' ? '#ef4444' : '#10b981'} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={trend === 'down' ? '#ef4444' : '#10b981'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={trend === 'down' ? '#ef4444' : '#10b981'}
                                        fill={`url(#gradient-${title})`}
                                        strokeWidth={1.5}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {isClickable && (
                    <div className="flex items-center justify-end mt-2 text-xs text-primary">
                        <span>View details</span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Compact KPI for dense dashboards
export function KPICardMini({
    title,
    value,
    change,
    trend = 'neutral',
    icon,
}: Pick<KPICardProps, 'title' | 'value' | 'change' | 'trend' | 'icon'>) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            {icon && (
                <div className="p-2 rounded-lg bg-muted">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{title}</p>
                <p className="text-lg font-semibold">{value}</p>
            </div>
            {change !== undefined && (
                <div className={cn(
                    'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                    trend === 'up' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    trend === 'down' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    trend === 'neutral' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}>
                    {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    <span>{change > 0 ? '+' : ''}{change}%</span>
                </div>
            )}
        </div>
    );
}
