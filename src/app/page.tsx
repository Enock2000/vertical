'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { BarChart, CheckCircle, FileText, Briefcase, ShieldCheck, Trophy, Users, Zap } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { placeholderImages } from '@/lib/placeholder-images.json';

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

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Logo />
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="#features">Features</Link>
            <Link href="#testimonials">Testimonials</Link>
            <Link href="#pricing">Pricing</Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Admin Login</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Get Started</Link>
            </Button>
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
            <Carousel
                className="w-full"
                opts={{
                    loop: true,
                }}
                plugins={[
                    require('embla-carousel-autoplay')({ delay: 10000, stopOnInteraction: true }),
                ]}
                >
                <CarouselContent>
                    {placeholderImages.map((image) => (
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
                                />
                            </CardContent>
                        </Card>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
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

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-28">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Loved by Growing Companies
                    </h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
                        See how VerticalSync is transforming HR for businesses like yours.
                    </p>
                </div>
                 <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-muted-foreground">"The automation has saved us countless hours. Payroll is now a one-click process instead of a week-long headache."</p>
                        <div className="mt-4 flex items-center gap-4">
                            <Image src="https://picsum.photos/seed/person1/40/40" alt="Avatar" width={40} height={40} className="rounded-full" data-ai-hint="person face" />
                            <div>
                                <p className="font-semibold">Jane Doe</p>
                                <p className="text-sm text-muted-foreground">CEO, Innovate Inc.</p>
                            </div>
                        </div>
                    </div>
                     <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-muted-foreground">"Compliance used to be our biggest worry. VerticalSync's AI advisor gives us peace of mind and keeps us up-to-date."</p>
                        <div className="mt-4 flex items-center gap-4">
                             <Image src="https://picsum.photos/seed/person2/40/40" alt="Avatar" width={40} height={40} className="rounded-full" data-ai-hint="person face" />
                            <div>
                                <p className="font-semibold">John Smith</p>
                                <p className="text-sm text-muted-foreground">HR Manager, Tech Solutions</p>
                            </div>
                        </div>
                    </div>
                     <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <p className="text-muted-foreground">"Our employee onboarding is smoother than ever. The new hires love the self-service portal."</p>
                        <div className="mt-4 flex items-center gap-4">
                            <Image src="https://picsum.photos/seed/person3/40/40" alt="Avatar" width={40} height={40} className="rounded-full" data-ai-hint="person face" />
                            <div>
                                <p className="font-semibold">Emily White</p>
                                <p className="text-sm text-muted-foreground">Operations Head, Creative Co.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="py-20 md:py-28 bg-muted/50">
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
                <Logo />
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} VerticalSync Inc. All rights reserved.</p>
                 <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="#">Terms of Service</Link>
                    <Link href="#">Privacy Policy</Link>
                </nav>
            </div>
        </footer>
    </div>
  );
}
