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
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

/* -------------------------------------------------------------------------- */
/*  DATA – CLICKABLE LINKS                                                  */
/* -------------------------------------------------------------------------- */
const featuresList = [
  { icon: <FileText />, title: 'Automated Payroll', description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.', href: '/features/automated-payroll' },
  { icon: <ShieldCheck />, title: 'Compliance Management', description: 'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.', href: '/features/compliance-management' },
  { icon: <Briefcase />, title: 'Recruitment & Onboarding', description: 'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.', href: '/features/recruitment-onboarding' },
  { icon: <Trophy />, title: 'Performance & Training', description: 'Set goals, track performance, and manage employee training programs with ease.', href: '/features/performance-training' },
  { icon: <Users />, title: 'Employee Self-Service', description: 'Empower your employees with a portal to manage attendance, leave, and payslips.', href: '/features/employee-self-service' },
  { icon: <BarChart3 />, title: 'Insightful Reporting', description: 'Get real-time insights into your workforce with comprehensive analytics.', href: '/features/insightful-reporting' },
] as const;

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/careers", label: "Jobs Centre" },
  { href: "/who-we-serve", label: "Who We Serve" },
  { href: "/pricing", label: "Pricing" },
] as const;

/* -------------------------------------------------------------------------- */
/*  SCROLL ANIMATION VARIANTS                                               */
/* -------------------------------------------------------------------------- */
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
    transition: { staggerChildren: 0.2 }
  }
};

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                               */
/* -------------------------------------------------------------------------- */
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">

      {/* ---------------------------------------------------- HEADER ---------------------------------------------------- */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/80 backdrop-blur-xl"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="transition-all hover:text-primary hover:scale-105">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="text-primary hover:text-primary">Login</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-purple-700 text-white shadow-lg hover:shadow-primary/25 transition-all hover:scale-105">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white/95 backdrop-blur-xl border-l border-purple-100">
                <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                  {navLinks.map(l => (
                    <SheetClose asChild key={l.href}>
                      <Link href={l.href} className="text-gray-700 hover:text-primary">{l.label}</Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild><Link href="/post-a-job" className="text-gray-700 hover:text-primary">Post a Job</Link></SheetClose>
                  <SheetClose asChild><Link href="/login" className="text-primary">Login</Link></SheetClose>
                  <SheetClose asChild>
                    <Button className="w-full bg-gradient-to-r from-primary to-primary text-white">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* ---------------------------------------------------- MAIN ---------------------------------------------------- */}
      <main className="relative flex-1">

        {/* ---------- OFFICE IMAGE WITH PEOPLE ---------- */}
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop"
          alt="Team collaborating in modern office"
          fill
          className="object-cover"
          priority
        />

        {/* Purple tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent z-10" />

        {/* ---------- HERO (Animated) ---------- */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-purple-900/20 to-transparent z-10" />
          <div className="relative z-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <motion.p {...fadeUp} className="text-sm font-bold tracking-widest uppercase text-purple-300">
              Global People Platform
            </motion.p>
            <motion.h1
              {...fadeUp}
              transition={{ delay: 0.2 }}
              className="mt-3 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200"
            >
              Scale globally with velocity and ease
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-purple-100 font-light leading-relaxed"
            >
              VerticalSync is built to scale with organizations of all sizes, from small teams to enterprises.
              Whether hiring worldwide or streamlining HR—VerticalSync does it all with full compliance.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.6 }}
              className="mt-10"
            >
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-purple-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-primary/50 transform hover:scale-105 transition-all duration-300 animate-pulse">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* ---------- FEATURES (3D TILT + Animated + Clickable) ---------- */}
        <motion.section
          {...fadeUp}
          id="features"
          className="relative py-24 md:py-32"
        >
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-extrabold text-gray-900"
            >
              Everything you need. Nothing you don't.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-600"
            >
              Discover a full suite of HR tools designed to streamline your operations and empower your team.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-4xl mx-auto"
            >
              {featuresList.map((f, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Link href={f.href} className="block">
                    <Tilt
                      className="w-full"
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      perspective={1000}
                      scale={1.05}
                      transitionSpeed={1500}
                      gyroscope={true}
                    >
                      <Card className="bg-white/10 backdrop-blur-lg border border-primary/30 rounded-2xl p-6 h-full shadow-xl transition-all duration-300 hover:shadow-primary/30 hover:border-primary">
                        <CardHeader className="flex flex-row items-center gap-4">
                          <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary text-white shadow-lg">
                            {React.cloneElement(f.icon, { className: 'h-7 w-7' })}
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-800">{f.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 leading-relaxed">{f.description}</p>
                        </CardContent>
                      </Card>
                    </Tilt>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ---------- PRICING (Animated) ---------- */}
        <motion.section
          {...fadeUp}
          id="pricing"
          className="relative py-24 md:py-32 bg-gradient-to-b from-transparent to-purple-50/50"
        >
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-extrabold text-gray-900"
            >
              Find the Perfect Plan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-600"
            >
              Simple, transparent pricing that scales with your business.
            </motion.p>

            {loadingPlans ? (
              <div className="flex justify-center mt-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-4xl mx-auto"
              >
                {plans.map((p, i) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <Tilt
                      tiltMaxAngleX={8}
                      tiltMaxAngleY={8}
                      perspective={1000}
                      scale={1.03}
                      transitionSpeed={1200}
                    >
                      <Card className="flex flex-col bg-white/10 backdrop-blur-lg border border-primary/30 rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:border-primary">
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold text-gray-800">{p.name}</CardTitle>
                          <CardContent className="p-0 pt-4">
                            <span className="text-5xl font-extrabold text-primary">{currencyFormatter.format(p.price)}</span>
                            <span className="text-gray-600">/month</span>
                          </CardContent>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-5 mt-4">
                          <p className="font-semibold text-gray-700">{p.jobPostings} job postings included</p>
                          <ul className="space-y-3 text-sm text-gray-600">
                            {p.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardContent className="pt-6">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-primary/40 transition-all hover:scale-105">
                            <Link href="/signup">Choose Plan</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </Tilt>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* ---------- CTA (Animated) ---------- */}
        <motion.section
          {...fadeUp}
          className="relative py-24 md:py-32"
        >
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring" }}
              className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6"
            >
              <Zap className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-extrabold text-gray-900"
            >
              Ready to Simplify Your HR?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-600"
            >
              Join dozens of companies streamlining their operations with VerticalSync. Get started today.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="mt-10"
            >
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-purple-700 text-white font-bold text-lg px-10 py-7 rounded-full shadow-xl hover:shadow-primary/50 transform hover:scale-110 transition-all duration-300">
                <Link href="/signup">Sign Up for Free</Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* ---------------------------------------------------- FOOTER ---------------------------------------------------- */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative border-t border-purple-100 bg-white/80 backdrop-blur-xl"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.
          </p>
          <nav className="flex items-center space-x-6 text-sm font-medium text-gray-700">
            <Link href="/documentation" className="hover:text-primary transition-colors">Documentation</Link>
            <Link href="/docs/api" className="hover:text-primary transition-colors">API Docs</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </nav>
        </div>
      </motion.footer>
    </div>
  );
}
