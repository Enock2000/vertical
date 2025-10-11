
// src/app/applicant-portal/layout.tsx
'use client';

import Link from "next/link";
import React, { useEffect } from "react";
import {
    LayoutDashboard,
    User,
    PanelLeft,
    Briefcase,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/components/logo";
import { Loader2 } from "lucide-react";

const navItems = [
  { href: "/applicant-portal", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/applicant-portal/profile", icon: User, label: "My Profile" },
  { href: "/careers", icon: Briefcase, label: "All Jobs" },
];

export default function ApplicantPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, employee, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/employee-login');
      } else if (employee && employee.role !== 'Applicant') {
        // If logged in but not an applicant, redirect them appropriately
        router.push(employee.role === 'Admin' || employee.role === 'Super Admin' ? '/dashboard' : '/employee-portal');
      }
    }
  }, [user, employee, loading, router]);


  if (loading || !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6">
           <Link
            href="/applicant-portal"
            className="flex items-center gap-2 font-semibold"
          >
            <Logo />
          </Link>
        </div>
        <ScrollArea className="flex-grow">
            <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname === item.href ? "bg-muted text-primary" : ""
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
                  href="/applicant-portal"
                  className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold"
                >
                  <Logo />
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
          <div className="relative ml-auto flex-1 md:grow-0" />
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-4">{children}</main>
      </div>
    </div>
  );
}
