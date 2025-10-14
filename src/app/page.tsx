
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import {
  Users,
  Briefcase,
  BarChart3,
  FileText,
  ShieldCheck,
  Trophy,
  Menu,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { SubscriptionPlan } from '@/lib/data';
import { Loader2 } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/careers', label: 'Jobs Centre' },
  { href: '/post-a-job', label: 'Post a Job' },
  { href: '/who-we-serve', label: 'Who We Serve' },
];

const features = [
  { 
    icon: <FileText className="h-6 w-6 text-primary" />, 
    title: "Automated Payroll", 
    description: "Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically." 
  },
  { 
    icon: <ShieldCheck className="h-6 w-6 text-primary" />, 
    title: "Compliance Management", 
    description: "Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine." 
  },
  { 
    icon: <Briefcase className="h-6 w-6 text-primary" />, 
    title: "Recruitment & Onboarding", 
    description: "From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place." 
  },
  { 
    icon: <Trophy className="h-6 w-6 text-primary" />, 
    title: "Performance & Training", 
    description: "Set goals, track performance with 360-degree feedback, and manage employee training programs." 
  },
  { 
    icon: <Users className="h-6 w-6 text-primary" />, 
    title: "Employee Self-Service", 
    description: "Empower your employees with a portal to manage their attendance, leave, and view payslips." 
  },
  { 
    icon: <BarChart3 className="h-6 w-6 text-primary" />, 
    title: "Insightful Reporting", 
    description: "Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and diversity." 
  }
];


export default function HomePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const plansRef = ref(db, 'subscriptionPlans');
    const unsubscribe = onValue(plansRef, (snapshot) => {
        const data = snapshot.val();
        setPlans(data ? Object.values(data) : []);
        setLoadingPlans(false);
    }, (error) => {
        console.error(error);
        setLoadingPlans(false);
    });

    return () => unsubscribe();
  }, []);

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Logo />
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
                 <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">{link.label}</Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center justify-end space-x-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Get Started</Link>
            </Button>
          </div>
          
           <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                         <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                            <Logo />
                            {navLinks.map(link => (
                                <SheetClose asChild key={link.href}>
                                    <Link href={link.href}>{link.label}</Link>
                                </SheetClose>
                            ))}
                            <SheetClose asChild>
                                <Link href="/login">Login</Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>
           </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-20 md:pt-32 pb-10 md:pb-16">
          <div className="container text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              The All-in-One HR Platform for Modern Businesses
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              VerticalSync automates your payroll, compliance, and HR processes, so you can focus on what matters most: your people.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Request a Demo</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Everything you need. Nothing you don't.
                </h2>
                <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                    Discover a full suite of HR tools designed to streamline your operations and empower your team.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28">
            <div className="container">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Find the Perfect Plan
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        Simple, transparent pricing that scales with your business.
                    </p>
                </div>
                {loadingPlans ? (
                     <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription>
                                        <span className="text-3xl font-bold">{currencyFormatter.format(plan.price)}</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="font-semibold">{plan.jobPostings} job postings included</p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardContent className="pt-0">
                                    <Button className="w-full" asChild>
                                        <Link href="/signup">Choose Plan</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>

      </main>

      {/* Footer */}
        <footer className="border-t">
            <div className="container py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.</p>
                 <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/documentation">Documentation</Link>
                    <Link href="#">Terms of Service</Link>
                    <Link href="#">Privacy Policy</Link>
                </nav>
            </div>
        </footer>
    </div>
  );
}
