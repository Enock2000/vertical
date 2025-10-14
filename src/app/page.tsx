
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { BarChart, CheckCircle, FileText, Briefcase, ShieldCheck, Trophy, Users, Zap, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Testimonial, SubscriptionPlan } from '@/lib/data';
import { Loader2 } from 'lucide-react';

const features = [
  {
    icon: <FileText />,
    title: 'Automated Payroll',
    description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Compliance Management',
    description: 'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.',
  },
  {
    icon: <Briefcase />,
    title: 'Recruitment & Onboarding',
    description: 'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
  },
  {
    icon: <Trophy />,
    title: 'Performance & Training',
    description: 'Set goals, track performance with 360-degree feedback, and manage employee training programs.',
  },
  {
    icon: <Users />,
    title: 'Employee Self-Service',
    description: 'Empower your employees with a portal to manage their attendance, leave, and view payslips.',
  },
  {
    icon: <BarChart />,
    title: 'Insightful Reporting',
    description: 'Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and diversity.',
  },
];

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "/careers", label: "Jobs Centre" },
    { href: "/who-we-serve", label: "Who We Serve" },
    { href: "/pricing", label: "Pricing" },
];

interface HeroImage {
    id: string;
    imageUrl: string;
    description: string;
    imageHint: string;
}

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loadingHeroImages, setLoadingHeroImages] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const testimonialsQuery = query(ref(db, 'testimonials'), orderByChild('status'), equalTo('Approved'));
    const unsubscribeTestimonials = onValue(testimonialsQuery, (snapshot) => {
        const data = snapshot.val();
        setTestimonials(data ? Object.values(data) : []);
        setLoadingTestimonials(false);
    });

    const heroImagesRef = ref(db, 'platformSettings/heroImages');
    const unsubscribeImages = onValue(heroImagesRef, (snapshot) => {
        const data = snapshot.val();
        setHeroImages(data ? Object.values(data) : []);
        setLoadingHeroImages(false);
    });
    
    const plansRef = ref(db, 'subscriptionPlans');
    const unsubscribePlans = onValue(plansRef, (snapshot) => {
        const data = snapshot.val();
        setPlans(data ? Object.values(data) : []);
        setLoadingPlans(false);
    });

    return () => {
        unsubscribeTestimonials();
        unsubscribeImages();
        unsubscribePlans();
    };
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
                 <Link key={link.href} href={link.href}>{link.label}</Link>
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
          
           {/* Mobile Navigation */}
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
                            <SheetClose asChild><Link href="#features">Features</Link></SheetClose>
                             <SheetClose asChild><Link href="/careers">Jobs Centre</Link></SheetClose>
                             <SheetClose asChild><Link href="/who-we-serve">Who We Serve</Link></SheetClose>
                             <SheetClose asChild><Link href="/pricing">Pricing</Link></SheetClose>
                             <SheetClose asChild><Link href="/post-a-job">Post a Job</Link></SheetClose>
                            <SheetClose asChild><Link href="/login">Login</Link></SheetClose>
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
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </section>
        
        <div className="relative my-16">
            {loadingHeroImages ? (
                 <div className="flex items-center justify-center h-[600px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Carousel
                    className="w-full"
                    opts={{ loop: true, }}
                    plugins={[ require('embla-carousel-autoplay')({ delay: 5000, stopOnInteraction: true }), ]}
                    >
                    <CarouselContent>
                        {heroImages.map((image) => (
                        <CarouselItem key={image.id}>
                            <Card className="overflow-hidden border-0 rounded-none">
                                <CardContent className="p-0">
                                    <Image
                                        src={image.imageUrl}
                                        alt={image.description}
                                        width={1600}
                                        height={800}
                                        className="w-full max-h-[600px] aspect-video object-cover"
                                        data-ai-hint={image.imageHint}
                                        priority
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                </Carousel>
            )}
        </div>


        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-muted/50">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Everything you need. Nothing you don't.
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                Stop juggling multiple systems. VerticalSync brings all your essential HR functions under one roof.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm">
                   <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        {React.cloneElement(feature.icon, { className: "h-6 w-6" })}
                    </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Find a Plan That's Right For You
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        Simple, transparent pricing. No hidden fees.
                    </p>
                </div>
                 {loadingPlans ? (
                     <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                 ) : (
                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => (
                        <Card key={plan.id} className="flex flex-col">
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
                            <CardContent>
                                <Button className="w-full" asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                 )}
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-28 bg-muted/50">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Loved by Growing Companies
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        See how VerticalSync is transforming HR for businesses like yours.
                    </p>
                </div>
                {loadingTestimonials ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : testimonials.length > 0 ? (
                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="rounded-lg border bg-card p-6 shadow-sm">
                                <p className="text-muted-foreground">"{testimonial.testimonialText}"</p>
                                <div className="mt-4 flex items-center gap-4">
                                     <Image src={`https://avatar.vercel.sh/${testimonial.authorName}.png`} alt="Avatar" width={40} height={40} className="rounded-full" />
                                    <div>
                                        <p className="font-semibold">{testimonial.authorName}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.authorTitle}, {testimonial.companyName}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 text-center text-muted-foreground">
                        <p>No testimonials yet. Be the first!</p>
                    </div>
                )}
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container text-center">
            <Zap className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Simplify Your HR?
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
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
            <div className="container py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} VerticalSync powered by Oran Investment. All rights reserved.</p>
                 <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/documentation">Documentation</Link>
                    <Link href="/careers">Jobs Centre</Link>
                    <Link href="#">Terms of Service</Link>
                    <Link href="#">Privacy Policy</Link>
                </nav>
            </div>
        </footer>
    </div>
  );
}
