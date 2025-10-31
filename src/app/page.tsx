// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import {
  CheckCircle,
  FileText,
  Briefcase,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
  Menu,
  BarChart3,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Testimonial, SubscriptionPlan } from '@/lib/data';

const featuresList = [
  {
    icon: <FileText />,
    title: 'Automated Payroll',
    description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
    href: '/features/automated-payroll',
  },
  {
    icon: <ShieldCheck />,
    title: 'Compliance Management',
    description: 'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.',
    href: '/features/compliance-management',
  },
  {
    icon: <Briefcase />,
    title: 'Recruitment & Onboarding',
    description: 'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
    href: '/features/recruitment-onboarding',
  },
  {
    icon: <Trophy />,
    title: 'Performance & Training',
    description: 'Set goals, track performance, and manage employee training programs with ease.',
    href: '/features/performance-training',
  },
  {
    icon: <Users />,
    title: 'Employee Self-Service',
    description: 'Empower your employees with a portal to manage attendance, leave, and payslips.',
    href: '/features/employee-self-service',
  },
  {
    icon: <BarChart3 />,
    title: 'Insightful Reporting',
    description: 'Get real-time insights into your workforce with comprehensive analytics.',
    href: '/features/insightful-reporting',
  },
];

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "/careers", label: "Jobs Centre" },
  { href: "/who-we-serve", label: "Who We Serve" },
  { href: "/pricing", label: "Pricing" },
];

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const testimonialsQuery = query(ref(db, 'testimonials'), orderByChild('status'), equalTo('Approved'));
    const unsubscribeTestimonials = onValue(testimonialsQuery, (snapshot) => {
      const data = snapshot.val();
      setTestimonials(data ? Object.values(data) : []);
      setLoadingTestimonials(false);
    });

    const plansRef = ref(db, 'subscriptionPlans');
    const unsubscribePlans = onValue(plansRef, (snapshot) => {
      const data = snapshot.val();
      setPlans(data ? Object.values(data) : []);
      setLoadingPlans(false);
    });

    return () => {
      unsubscribeTestimonials();
      unsubscribePlans();
    };
  }, []);

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
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
                    <Link href="/post-a-job">Post a Job</Link>
                  </SheetClose>
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

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 text-white flex items-center justify-center overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop"
            alt="People working in an office"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="relative z-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-accent tracking-wider uppercase">Global People Platform</p>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mt-2">
              Scale globally with velocity and ease
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-white/80 md:text-xl">
              VerticalSync is built to scale with organizations of all sizes, from small teams to enterprises.
              Whether hiring worldwide or streamlining HR—VerticalSync does it all with full compliance.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 md:py-28">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Everything you need. Nothing you don't.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
              Discover a full suite of HR tools designed to streamline your operations and empower your team.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
              {featuresList.map((feature, index) => (
                <Link key={index} href={feature.href} className="block group">
                  <Card className="bg-card h-full transition-colors group-hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-primary' })}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 md:py-28 bg-muted/50">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Find the Perfect Plan</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
              Simple, transparent pricing that scales with your business.
            </p>

            {loadingPlans ? (
              <div className="flex justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
                {plans.map((plan) => (
                  <Card key={plan.id} className="flex flex-col bg-card">
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardContent className="p-0 pt-4">
                        <span className="text-4xl font-bold">{currencyFormatter.format(plan.price)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </CardContent>
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

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Zap className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Simplify Your HR?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
              Join dozens of companies streamlining their operations with VerticalSync. Get started today.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">Sign Up for Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.
          </p>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/documentation">Documentation</Link>
            <Link href="/docs/api">API Docs</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
