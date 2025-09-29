
// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import React, { useEffect } from "react";
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
    ClipboardCheck,
    Landmark,
    Briefcase,
    Trophy,
    Loader2,
    CalendarCheck,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider"; // Import the useAuth hook
import { auth } from '@/lib/firebase'; // Import auth correctly

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/employees", icon: Users, label: "Employees" },
  { href: "/dashboard/recruitment", icon: Briefcase, label: "Recruitment" },
  { href: "/dashboard/payroll", icon: FileText, label: "Payroll" },
  { href: "/dashboard/payment-methods", icon: Landmark, label: "Payment Methods" },
  { href: "/dashboard/leave", icon: CalendarPlus, label: "Leave" },
  { href: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
  { href: "/dashboard/roster", icon: CalendarCheck, label: "Roster" },
  { href: "/dashboard/performance", icon: Trophy, label: "Performance" },
  { href: "/dashboard/reporting", icon: BarChart3, label: "Reporting" },
  { href: "/dashboard/organization", icon: Network, label: "Organization" },
  { href: "/dashboard/compliance", icon: ShieldCheck, label: "Compliance" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
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
  const { user, employee, company, loading } = useAuth();

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
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <div className="flex flex-col items-center gap-4 px-2 sm:py-5">
           <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Briefcase className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">{company.name}</span>
          </Link>
        </div>
        <ScrollArea className="flex-grow">
            <nav className="flex flex-col items-center gap-4 px-2">
            <TooltipProvider>
                {navItems.map((item) => (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                        pathname.startsWith(item.href) && item.href !== "/dashboard" || pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
                ))}
            </TooltipProvider>
            </nav>
        </ScrollArea>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
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
                  href="/"
                  className="group flex h-10 shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold"
                >
                  <div className="flex items-center justify-center size-8 bg-primary text-primary-foreground rounded-md">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold text-foreground">{company.name}</span>
                </Link>
                {navItems.map((item) => (
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
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}
