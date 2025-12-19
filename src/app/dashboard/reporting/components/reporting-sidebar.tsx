// src/app/dashboard/reporting/components/reporting-sidebar.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    DollarSign,
    UserPlus,
    BookmarkCheck,
    ChevronDown,
    ChevronRight,
    BarChart3,
    TrendingUp,
    Clock,
    Award,
    UserMinus,
    FileText,
    Receipt,
    Briefcase,
    Timer,
    Target,
    PieChart,
    Building2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type ReportView =
    // Dashboards
    | 'executive-dashboard'
    | 'hr-manager-dashboard'
    | 'finance-dashboard'
    | 'custom-dashboard'
    // Recruitment
    | 'job-requisitions'
    | 'candidate-pipeline'
    | 'source-of-hire'
    | 'time-to-hire'
    | 'cost-per-hire'
    // HR & Employees
    | 'employee-master'
    | 'headcount'
    | 'attendance-leave'
    | 'performance'
    | 'turnover-attrition'
    // Payroll
    | 'payroll-summary'
    | 'tax-compliance'
    | 'benefits-compensation'
    | 'overtime-allowances'
    // Saved
    | 'saved-reports';

interface NavItem {
    id: ReportView;
    label: string;
    icon: React.ElementType;
    badge?: number;
}

interface NavCategory {
    id: string;
    label: string;
    icon: React.ElementType;
    items: NavItem[];
    defaultOpen?: boolean;
}

const navigationStructure: NavCategory[] = [
    {
        id: 'dashboards',
        label: 'Dashboards',
        icon: LayoutDashboard,
        defaultOpen: true,
        items: [
            { id: 'executive-dashboard', label: 'Executive', icon: TrendingUp },
            { id: 'hr-manager-dashboard', label: 'HR Manager', icon: Users },
            { id: 'finance-dashboard', label: 'Finance', icon: DollarSign },
            { id: 'custom-dashboard', label: 'Custom', icon: PieChart },
        ],
    },
    {
        id: 'recruitment',
        label: 'Recruitment',
        icon: UserPlus,
        items: [
            { id: 'job-requisitions', label: 'Job Requisitions', icon: FileText },
            { id: 'candidate-pipeline', label: 'Candidate Pipeline', icon: Target },
            { id: 'source-of-hire', label: 'Source of Hire', icon: PieChart },
            { id: 'time-to-hire', label: 'Time-to-Hire', icon: Timer },
            { id: 'cost-per-hire', label: 'Cost-per-Hire', icon: Receipt },
        ],
    },
    {
        id: 'hr-employees',
        label: 'HR & Employees',
        icon: Users,
        items: [
            { id: 'employee-master', label: 'Employee Master', icon: Users },
            { id: 'headcount', label: 'Headcount', icon: BarChart3 },
            { id: 'attendance-leave', label: 'Attendance & Leave', icon: Clock },
            { id: 'performance', label: 'Performance', icon: Award },
            { id: 'turnover-attrition', label: 'Turnover & Attrition', icon: UserMinus },
        ],
    },
    {
        id: 'payroll',
        label: 'Payroll',
        icon: DollarSign,
        items: [
            { id: 'payroll-summary', label: 'Payroll Summary', icon: Receipt },
            { id: 'tax-compliance', label: 'Tax & Compliance', icon: FileText },
            { id: 'benefits-compensation', label: 'Benefits & Compensation', icon: Briefcase },
            { id: 'overtime-allowances', label: 'Overtime & Allowances', icon: Clock },
        ],
    },
    {
        id: 'saved',
        label: 'Saved Reports',
        icon: BookmarkCheck,
        items: [
            { id: 'saved-reports', label: 'My Saved Reports', icon: BookmarkCheck },
        ],
    },
];

interface ReportingSidebarProps {
    activeView: ReportView;
    onViewChange: (view: ReportView) => void;
    className?: string;
    collapsed?: boolean;
}

export function ReportingSidebar({
    activeView,
    onViewChange,
    className,
    collapsed = false
}: ReportingSidebarProps) {
    const [openCategories, setOpenCategories] = React.useState<string[]>(['dashboards']);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Find active category and expand it
    React.useEffect(() => {
        const activeCategory = navigationStructure.find(cat =>
            cat.items.some(item => item.id === activeView)
        );
        if (activeCategory && !openCategories.includes(activeCategory.id)) {
            setOpenCategories(prev => [...prev, activeCategory.id]);
        }
    }, [activeView]);

    if (collapsed) {
        return (
            <div className={cn("w-16 border-r bg-card/50 backdrop-blur-sm", className)}>
                <ScrollArea className="h-full py-4">
                    <div className="space-y-2 px-2">
                        {navigationStructure.map((category) => (
                            <Button
                                key={category.id}
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-12 h-12 rounded-xl",
                                    category.items.some(item => item.id === activeView) &&
                                    "bg-primary/10 text-primary"
                                )}
                                title={category.label}
                                onClick={() => {
                                    const firstItem = category.items[0];
                                    if (firstItem) onViewChange(firstItem.id);
                                }}
                            >
                                <category.icon className="h-5 w-5" />
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className={cn(
            "w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col",
            className
        )}>
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">Reports</h2>
                        <p className="text-xs text-muted-foreground">Analytics & Insights</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-2">
                <div className="space-y-1 px-2">
                    {navigationStructure.map((category) => (
                        <Collapsible
                            key={category.id}
                            open={openCategories.includes(category.id)}
                            onOpenChange={() => toggleCategory(category.id)}
                        >
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-between px-3 py-2 h-auto font-medium text-sm",
                                        "hover:bg-muted/50 transition-colors",
                                        category.items.some(item => item.id === activeView) &&
                                        "text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <category.icon className="h-4 w-4" />
                                        <span>{category.label}</span>
                                    </div>
                                    {openCategories.includes(category.id) ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-0.5 ml-4 mt-1">
                                {category.items.map((item) => (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full justify-start gap-2 pl-4 h-9 font-normal text-sm",
                                            "hover:bg-muted/50 transition-all",
                                            activeView === item.id && [
                                                "bg-primary/10 text-primary font-medium",
                                                "border-l-2 border-primary -ml-[2px] pl-[calc(1rem+2px)]"
                                            ]
                                        )}
                                        onClick={() => onViewChange(item.id)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="truncate">{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t">
                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-3">
                    <div className="flex items-center gap-2 text-xs">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Enterprise Analytics</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
