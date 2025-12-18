// src/app/dashboard/analytics/components/charts/funnel-chart.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FunnelStage {
    name: string;
    value: number;
    color?: string;
}

interface FunnelChartProps {
    title?: string;
    description?: string;
    data: FunnelStage[];
    onStageClick?: (stage: FunnelStage) => void;
    className?: string;
    showPercentage?: boolean;
}

const defaultColors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-emerald-500',
];

export function FunnelChart({
    title,
    description,
    data,
    onStageClick,
    className,
    showPercentage = true,
}: FunnelChartProps) {
    const maxValue = Math.max(...data.map(d => d.value));

    const content = (
        <div className="space-y-3">
            {data.map((stage, idx) => {
                const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                const conversionRate = idx > 0 && data[idx - 1].value > 0
                    ? ((stage.value / data[idx - 1].value) * 100).toFixed(1)
                    : null;

                return (
                    <div
                        key={stage.name}
                        className={cn(
                            'group',
                            onStageClick && 'cursor-pointer'
                        )}
                        onClick={() => onStageClick?.(stage)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{stage.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{stage.value.toLocaleString()}</span>
                                {showPercentage && conversionRate && (
                                    <span className="text-xs text-muted-foreground">
                                        ({conversionRate}%)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                            <div
                                className={cn(
                                    'absolute left-0 top-0 h-full rounded-md transition-all duration-300',
                                    stage.color || defaultColors[idx % defaultColors.length],
                                    onStageClick && 'group-hover:opacity-80'
                                )}
                                style={{ width: `${widthPercent}%` }}
                            />
                        </div>
                    </div>
                );
            })}
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
