

// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider"; // Import the useAuth hook
import { auth, db } from '@/lib/firebase'; // Import auth correctly
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

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", permission: "dashboard" as Permission },
  { href: "/dashboard/employees", icon: Users, label: "Employees", permission: "employees" as Permission },
  { href: "/dashboard/recruitment", icon: Briefcase, label: "Recruitment", permission: "recruitment" as Permission },
  { href: "/dashboard/payroll", icon: FileText, label: "Payroll", permission: "payroll" as Permission },
  { href: "/dashboard/payment-methods", icon: Landmark, label: "Payment Methods", permission: "payment-methods" as Permission },
  { href: "/dashboard/leave", icon: CalendarPlus, label: "Leave", permission: "leave" as Permission },
  { href: "/dashboard/performance", icon: Trophy, label: "Performance", permission: "performance" as Permission },
  { href: "/dashboard/announcements", icon: Megaphone, label: "Announcements", permission: "announcements" as Permission },
  { href: "/dashboard/reporting", icon: BarChart3, label: "Reporting", permission: "reporting" as Permission },
  { href: "/dashboard/organization", icon: Network, label: "Organization", permission: "organization" as Permission },
  { href: "/dashboard/compliance", icon: ShieldCheck, label: "Compliance", permission: "compliance" as Permission },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", permission: "settings" as Permission },
];

const AccessDenied = ({ title, description }: { title: string, description: string }) => (
    <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                   {title === 'Pending Approval' ? <Clock className="text-yellow-500" /> : <AlertTriangle className="text-destructive" />}
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, employee, company, loading, companyId } = useAuth();
  const [adminRole, setAdminRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (employee?.role === 'Super Admin') {
        router.push('/super-admin');
      } else if (employee?.role !== 'Admin') {
        router.push('/employee-portal');
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

  const visibleNavItems = useMemo(() => {
    // If the user is the primary admin (no specific admin role), show all items.
    if (employee?.role === 'Admin' && !employee.adminRoleId) {
        return navItems;
    }
    if (adminRole) {
        return navItems.filter(item => adminRole.permissions.includes(item.permission));
    }
    // If role is still loading or not found, show nothing to be safe.
    return [];
  }, [employee, adminRole]);


  if (loading || !employee || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (company.status === 'Pending') {
      return <AccessDenied title="Pending Approval" description="Your company registration is currently under review. You will be notified once it has been approved." />
  }
  
  if (company.status === 'Rejected') {
      return <AccessDenied title="Registration Rejected" description="Your company registration has been rejected. Please contact support for more information." />
  }

  const breadcrumbItems = pathname.split('/').filter(Boolean).map((part, index, arr) => {
    const href = '/' + arr.slice(0, index + 1).join('/');
    const isLast = index === arr.length - 1;
    const text = part.charAt(0).toUpperCase() + part.slice(1);
    return { href, text, isLast };
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6">
           <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Logo companyName={company.name} />
          </Link>
        </div>
        <ScrollArea className="flex-grow">
            <nav className="flex flex-col gap-1 p-4">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      (pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
                          ? "bg-muted text-primary"
                          : ""
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
            </nav>
        </ScrollArea>
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
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold"
                >
                  <Logo companyName={company.name} />
                </Link>
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-2.5",
                      pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
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
    </div>
  );
}
