
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { CheckCircle, FileText, Briefcase, ShieldCheck, Trophy, Users, BarChart3, Menu, Loader2, Zap } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import type { Testimonial, SubscriptionPlan } from '@/lib/data';

const featuresList = [
  {
    icon: <FileText />,
    title: 'Automated Payroll',
    description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
    href: '/features/automated-payroll'
  },
  {
    icon: <ShieldCheck />,
    title: 'Compliance Management',
    description: 'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.',
    href: '/features/compliance-management'
  },
  {
    icon: <Briefcase />,
    title: 'Recruitment & Onboarding',
    description: 'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
    href: '/features/recruitment-onboarding'
  },
  {
    icon: <Trophy />,
    title: 'Performance & Training',
    description: 'Set goals, track performance, and manage employee training programs with ease.',
    href: '/features/performance-training'
  },
  {
    icon: <Users />,
    title: 'Employee Self-Service',
    description: 'Empower your employees with a portal to manage their attendance, leave, and payslips.',
    href: '/features/employee-self-service'
  },
  {
    icon: <BarChart3 />,
    title: 'Insightful Reporting',
    description: 'Get real-time insights into your workforce with comprehensive analytics.',
    href: '/features/insightful-reporting'
  },
];

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/careers", label: "Jobs Centre" },
  { href: "/who-we-serve", label: "Who We Serve" },
  { href: "/pricing", label: "Pricing" },
];

const fadeUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const plansRef = ref(db, 'subscriptionPlans');
    const unsubscribePlans = onValue(plansRef, (snapshot) => {
      const data = snapshot.val();
      setPlans(data ? Object.values(data) : []);
      setLoadingPlans(false);
    });

    return () => unsubscribePlans();
  }, []);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW'
  });

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* ---- GLOBAL BACKGROUND IMAGE ---- */}
<div className="absolute inset-0 -z-10">
  <Image
    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80" // Office people background
    alt="Office teamwork background"
    fill
    className="object-cover object-center brightness-100 contrast-105"
    priority
    data-ai-hint="office teamwork"
  />
  {/* Light overlay to improve text readability */}
  <div className="absolute inset-0 bg-white/60" />
</div>

      {/* ---- HEADER ---- */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b border-indigo-200/50 bg-white/70 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-indigo-600 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:scale-105 transition">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white/95 backdrop-blur-xl border-l border-indigo-200">
                <nav className="flex flex-col gap-6 text-lg font-medium mt-8 text-gray-700">
                  {navLinks.map(link => (
                    <SheetClose asChild key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* ---- HERO SECTION ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-32"
      >
        <p className="text-sm font-bold tracking-widest uppercase text-primary">
          Global People Platform
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Scale globally with velocity and ease
        </h1>
        <p className="mt-6 max-w-3xl text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
          VerticalSync is built to scale with organizations of all sizes, from small teams to enterprises. 
          Whether hiring worldwide or streamlining HR — VerticalSync does it all with full compliance.
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </motion.section>

      {/* ---- FEATURES SECTION ---- */}
      <motion.section {...fadeUp} className="py-24 md:py-32 text-center">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Discover a full suite of HR tools designed to streamline your operations and empower your team.
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {featuresList.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={1500}>
                  <Link href={f.href}>
                    <Card className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-3xl p-6 h-full hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all">
                      <CardHeader className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                          {React.cloneElement(f.icon, { className: 'h-7 w-7' })}
                        </div>
                        <CardTitle className="text-xl text-left text-gray-900">{f.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-left text-gray-600">{f.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ---- PRICING ---- */}
      <motion.section {...fadeUp} className="py-24 md:py-32 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm text-center">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Find the Perfect Plan</h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Simple, transparent pricing that scales with your business.
          </p>

          {loadingPlans ? (
            <div className="flex justify-center mt-12">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((p) => (
                <Tilt key={p.id} tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03}>
                  <Card className="bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-3xl p-6 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-200/50 transition">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-gray-900">{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {currencyFormatter.format(p.price)}
                      </div>
                      <p className="text-gray-500 mb-4">/month</p>
                      <ul className="space-y-2 text-sm text-left text-gray-600">
                        {p.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-600" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardContent>
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white mt-6">
                        <Link href="/signup">Choose Plan</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </Tilt>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ---- CTA ---- */}
      <motion.section {...fadeUp} className="py-24 md:py-32 text-center">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-6">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Ready to Simplify Your HR?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Join dozens of companies streamlining their operations with VerticalSync. Get started today.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition"
            >
              <Link href="/signup">Sign Up for Free</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-indigo-200/50 bg-white/70 backdrop-blur-xl py-8 text-center text-sm text-gray-600">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link href="/documentation" className="hover:text-indigo-600">Documentation</Link>
            <Link href="/docs/api" className="hover:text-indigo-600">API Docs</Link>
            <Link href="#" className="hover:text-indigo-600">Terms</Link>
            <Link href="#" className="hover:text-indigo-600">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
