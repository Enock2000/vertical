// src/app/dashboard/reporting/components/drill-down-panel.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ArrowLeft, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BreadcrumbItem {
    id: string;
    label: string;
    data?: any;
}

interface DrillDownPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    onBreadcrumbClick?: (item: BreadcrumbItem, index: number) => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showExport?: boolean;
    onExport?: () => void;
    className?: string;
}

const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
};

export function DrillDownPanel({
    isOpen,
    onClose,
    title,
    subtitle,
    breadcrumbs = [],
    onBreadcrumbClick,
    children,
    footer,
    width = 'lg',
    showExport = false,
    onExport,
    className,
}: DrillDownPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
                    "animate-in fade-in-0 duration-200"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 flex flex-col",
                    "bg-background border-l shadow-2xl",
                    "animate-in slide-in-from-right duration-300",
                    isExpanded ? "w-full" : widthClasses[width],
                    className
                )}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <div className="px-4 pt-3 pb-2">
                            <nav className="flex items-center gap-1 text-sm">
                                {breadcrumbs.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        {index > 0 && (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <button
                                            onClick={() => onBreadcrumbClick?.(item, index)}
                                            disabled={index === breadcrumbs.length - 1}
                                            className={cn(
                                                "hover:text-primary transition-colors truncate max-w-[150px]",
                                                index === breadcrumbs.length - 1
                                                    ? "text-foreground font-medium cursor-default"
                                                    : "text-muted-foreground hover:underline"
                                            )}
                                            title={item.label}
                                        >
                                            {item.label}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Title bar */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={onClose}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold truncate">{title}</h2>
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            {showExport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5"
                                    onClick={onExport}
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {children}
                    </div>
                </ScrollArea>

                {/* Footer */}
                {footer && (
                    <>
                        <Separator />
                        <div className="flex-shrink-0 p-4 bg-muted/30">
                            {footer}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

// Drill Down Context for managing drill-down state
interface DrillDownState {
    isOpen: boolean;
    type: string;
    title: string;
    subtitle?: string;
    data: any;
    breadcrumbs: BreadcrumbItem[];
}

interface DrillDownContextType {
    state: DrillDownState;
    open: (type: string, title: string, data: any, subtitle?: string) => void;
    drillInto: (id: string, label: string, data: any) => void;
    goBack: () => void;
    close: () => void;
}

const DrillDownContext = React.createContext<DrillDownContextType | null>(null);

export function DrillDownProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<DrillDownState>({
        isOpen: false,
        type: '',
        title: '',
        data: null,
        breadcrumbs: [],
    });

    const open = React.useCallback((type: string, title: string, data: any, subtitle?: string) => {
        setState({
            isOpen: true,
            type,
            title,
            subtitle,
            data,
            breadcrumbs: [{ id: 'root', label: title, data }],
        });
    }, []);

    const drillInto = React.useCallback((id: string, label: string, data: any) => {
        setState(prev => ({
            ...prev,
            title: label,
            data,
            breadcrumbs: [...prev.breadcrumbs, { id, label, data }],
        }));
    }, []);

    const goBack = React.useCallback(() => {
        setState(prev => {
            if (prev.breadcrumbs.length <= 1) {
                return { ...prev, isOpen: false };
            }
            const newBreadcrumbs = prev.breadcrumbs.slice(0, -1);
            const last = newBreadcrumbs[newBreadcrumbs.length - 1];
            return {
                ...prev,
                title: last.label,
                data: last.data,
                breadcrumbs: newBreadcrumbs,
            };
        });
    }, []);

    const close = React.useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <DrillDownContext.Provider value={{ state, open, drillInto, goBack, close }}>
            {children}
        </DrillDownContext.Provider>
    );
}

export function useDrillDown() {
    const context = React.useContext(DrillDownContext);
    if (!context) {
        throw new Error('useDrillDown must be used within a DrillDownProvider');
    }
    return context;
}

// Quick stat component for drill-down content
interface QuickStatProps {
    label: string;
    value: string | number;
    description?: string;
    icon?: React.ElementType;
    trend?: { value: number; direction: 'up' | 'down' };
}

export function QuickStat({ label, value, description, icon: Icon, trend }: QuickStatProps) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            {Icon && (
                <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            )}
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold">{value}</span>
                    {trend && (
                        <Badge variant={trend.direction === 'up' ? 'default' : 'destructive'} className="h-5">
                            {trend.direction === 'up' ? '+' : ''}{trend.value}%
                        </Badge>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
        </div>
    );
}

// Detail row component
export function DetailRow({
    label,
    value,
    className
}: {
    label: string;
    value: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center justify-between py-2", className)}>
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
