
// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users,
  Home,
  FileText,
  ShieldCheck,
  PanelLeft,
  Search,
  CalendarPlus,
  BarChart3,
  Settings,
  Network,
  Briefcase,
  Trophy,
  Loader2,
  Clock,
  Landmark,
  AlertTriangle,
  Megaphone,
  DollarSign,
  Banknote,
  HardDrive,
  MessageSquare,
  ChevronDown,
  UserCircle,
  Wallet,
  CalendarClock,
  Star,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Permission, Role } from "@/lib/data";
import { ChatWaveFloatingButton } from "@/components/chat-wave-button";

// ─── Types ───
type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: Permission;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

// ─── Grouped Navigation Structure ───
const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    icon: Home,
    items: [
      { href: "/dashboard", icon: Home, label: "Dashboard", permission: "dashboard" as Permission },
    ],
  },
  {
    label: "People (Core HR)",
    icon: UserCircle,
    items: [
      { href: "/dashboard/employees", icon: Users, label: "Employees", permission: "employees" as Permission },
      { href: "/dashboard/organization", icon: Network, label: "Organization", permission: "organization" as Permission },
      { href: "/dashboard/files", icon: HardDrive, label: "Files", permission: "files" as Permission },
    ],
  },
  {
    label: "Recruitment",
    icon: Briefcase,
    items: [
      { href: "/dashboard/recruitment", icon: Briefcase, label: "Recruitment", permission: "recruitment" as Permission },
    ],
  },
  {
    label: "Payroll & Finance",
    icon: Wallet,
    items: [
      { href: "/dashboard/payroll", icon: FileText, label: "Payroll", permission: "payroll" as Permission },
      { href: "/dashboard/finance", icon: DollarSign, label: "Finance", permission: "finance" as Permission },
      { href: "/dashboard/loans", icon: Banknote, label: "Loans & Advances", permission: "finance" as Permission },
      { href: "/dashboard/payment-methods", icon: Landmark, label: "Payment Methods", permission: "payment-methods" as Permission },
    ],
  },
  {
    label: "Time & Leave",
    icon: CalendarClock,
    items: [
      { href: "/dashboard/leave", icon: CalendarPlus, label: "Leave", permission: "leave" as Permission },
      { href: "/dashboard/roster", icon: Clock, label: "Roster & Attendance", permission: "leave" as Permission },
    ],
  },
  {
    label: "Performance & Engagement",
    icon: Star,
    items: [
      { href: "/dashboard/performance", icon: Trophy, label: "Performance", permission: "performance" as Permission },
      { href: "/dashboard/announcements", icon: Megaphone, label: "Announcements", permission: "announcements" as Permission },
    ],
  },
  {
    label: "Reports & Compliance",
    icon: ClipboardList,
    items: [
      { href: "/dashboard/reporting", icon: BarChart3, label: "Reporting", permission: "reporting" as Permission },
      { href: "/dashboard/compliance", icon: ShieldCheck, label: "Compliance", permission: "compliance" as Permission },
    ],
  },
  {
    label: "System & Settings",
    icon: Wrench,
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "Settings", permission: "settings" as Permission },
      { href: "/dashboard/chat", icon: MessageSquare, label: "Vertical Sync Network", permission: "chat" as Permission },
      { href: "/dashboard/verification", icon: ShieldCheck, label: "Verification", permission: "settings" as Permission },
    ],
  },
];

const AccessDenied = ({ title, description, isTrialExpired = false }: { title: string, description: string, isTrialExpired?: boolean }) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          {title === 'Pending Approval' || isTrialExpired ? <Clock className="text-yellow-500" /> : <AlertTriangle className="text-destructive" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => auth.signOut()}>Logout</Button>
      </CardContent>
    </Card>
  </div>
)

// ─── Collapsible Nav Group Component ───
function SidebarGroup({
  group,
  visibleItems,
  pathname,
  expanded,
  onToggle,
}: {
  group: NavGroup;
  visibleItems: NavItem[];
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (visibleItems.length === 0) return null;

  // Dashboard group is special — single item, no dropdown
  if (group.label === "Dashboard") {
    const item = visibleItems[0];
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
          pathname === item.href
            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary hover:text-primary-foreground font-medium"
            : ""
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  const isAnyChildActive = visibleItems.some(
    item => (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-primary/10 hover:text-primary",
          isAnyChildActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            expanded ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 border-l border-border/50 pl-2 mt-0.5 space-y-0.5">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
                (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground font-medium"
                  : ""
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Collapsible Nav Group ───
function MobileSidebarGroup({
  group,
  visibleItems,
  pathname,
  expanded,
  onToggle,
}: {
  group: NavGroup;
  visibleItems: NavItem[];
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (visibleItems.length === 0) return null;

  if (group.label === "Dashboard") {
    const item = visibleItems[0];
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-4 px-2.5 text-lg",
          pathname === item.href ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  }

  const isAnyChildActive = visibleItems.some(
    item => (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-4 px-2.5 text-lg transition-colors",
          isAnyChildActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <group.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            expanded ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-7 border-l border-border/50 pl-3 mt-2 space-y-3">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 text-base",
                (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, employee, company, loading, companyId } = useAuth();
  const [adminRole, setAdminRole] = useState<Role | null>(null);

  // ─── Expand/collapse state per group ───
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Initially expand the group whose child matches the current path
    const initial: Record<string, boolean> = {};
    navGroups.forEach(group => {
      initial[group.label] = group.items.some(
        item => typeof window !== 'undefined' && (window.location.pathname.startsWith(item.href) && item.href !== "/dashboard")
      );
    });
    return initial;
  });

  // Auto-expand group when pathname changes
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev };
      navGroups.forEach(group => {
        if (group.items.some(item => (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href)) {
          next[group.label] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (employee && employee.role !== 'Admin' && employee.role !== 'Super Admin') {
        if (employee.role === 'GuestAdmin') {
          router.push('/guest-employer');
        } else {
          router.push('/employee-portal');
        }
      }
    }
  }, [user, employee, loading, router]);

  useEffect(() => {
    if (employee?.adminRoleId && companyId) {
      const roleRef = ref(db, `companies/${companyId}/roles/${employee.adminRoleId}`);
      const unsubscribe = onValue(roleRef, (snapshot) => {
        setAdminRole(snapshot.val());
      });
      return () => unsubscribe();
    }
  }, [employee, companyId]);

  // ─── Filter visible items per group based on permissions ───
  const getVisibleItems = useCallback((items: NavItem[]) => {
    if (!company) return [];
    if (company.enabledModules && company.enabledModules.length > 0) {
      return items.filter(item => company.enabledModules?.includes(item.permission));
    }
    if (employee?.role === 'Admin' && !employee.adminRoleId) {
      return items;
    }
    if (adminRole) {
      return items.filter(item => adminRole.permissions.includes(item.permission));
    }
    return items.filter(item => item.permission === 'dashboard');
  }, [employee, adminRole, company]);


  if (loading || !employee || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (company.subscription?.status === 'trial_expired') {
    return <AccessDenied
      title="Free Trial Expired"
      description="Your free trial has ended. Please contact the platform administrator to upgrade your plan and continue using the service."
      isTrialExpired={true}
    />
  }

  if (company.status === 'Pending') {
    return <AccessDenied title="Pending Approval" description="Your company registration is currently under review. You will be notified once it has been approved." />
  }

  if (company.status === 'Rejected') {
    return <AccessDenied title="Registration Rejected" description="Your company registration has been rejected. Please contact support for more information." />
  }

  if (employee.role !== 'Admin' && employee.role !== 'Super Admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }


  const breadcrumbItems = pathname.split('/').filter(Boolean).map((part, index, arr) => {
    const href = '/' + arr.slice(0, index + 1).join('/');
    const isLast = index === arr.length - 1;
    const text = part.charAt(0).toUpperCase() + part.slice(1);
    return { href, text, isLast };
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-gradient-to-b from-background via-background to-primary/5 sm:flex">
        <div className="flex h-16 items-center border-b px-6 bg-primary/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Logo companyName={company.name} logoUrl={company.logoUrl} />
          </Link>
        </div>
        <ScrollArea className="flex-grow">
          <nav className="flex flex-col gap-0.5 p-3">
            {navGroups.map((group) => {
              const visibleItems = getVisibleItems(group.items);
              return (
                <SidebarGroup
                  key={group.label}
                  group={group}
                  visibleItems={visibleItems}
                  pathname={pathname}
                  expanded={!!expandedGroups[group.label]}
                  onToggle={() => toggleGroup(group.label)}
                />
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4 bg-primary/5">
          <p className="text-xs text-muted-foreground text-center">VerticalSync v2.0</p>
        </div>
      </aside>
      <div className="flex flex-col sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0">
              <div className="p-6">
                <Link
                  href="/dashboard"
                  className="group flex h-10 shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold"
                >
                  <Logo companyName={company.name} logoUrl={company.logoUrl} />
                </Link>
              </div>
              <ScrollArea className="flex-grow">
                <nav className="flex flex-col gap-4 p-6 pt-0">
                  {navGroups.map((group) => {
                    const visibleItems = getVisibleItems(group.items);
                    return (
                      <MobileSidebarGroup
                        key={group.label}
                        group={group}
                        visibleItems={visibleItems}
                        pathname={pathname}
                        expanded={!!expandedGroups[group.label]}
                        onToggle={() => toggleGroup(group.label)}
                      />
                    );
                  })}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbItems.map(item => (
                <React.Fragment key={item.href}>
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage>{item.text}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.text}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!item.isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-4">{children}</main>
      </div>
      <ChatWaveFloatingButton chatPath="/dashboard/chat" />
    </div>
  );
}
