// src/app/who-we-serve/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Testimonial } from '@/lib/data';
import { Loader2, ArrowLeft, Building2, Users2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';

const businessSizes = [
  {
    title: 'Startups',
    description: 'Expand globally with streamlined operations',
    href: '/who-we-serve/startups'
  },
  {
    title: 'Mid-Market',
    description: 'Automate payroll as your company scales',
    href: '/who-we-serve/mid-market'
  },
  {
    title: 'Enterprise',
    description: 'Tools to grow and manage global teams',
    href: '/who-we-serve/enterprise'
  },
];

const teams = [
  {
    title: 'HR teams',
    description: 'Onboard and manage global teams easily',
    href: '/who-we-serve/for-teams'
  },
  {
    title: 'Finance teams',
    description: 'Save costs on global payroll and tools',
    href: '/who-we-serve/for-teams'
  },
  {
    title: 'Legal teams',
    description: 'Ensure compliance for global hiring',
    href: '/who-we-serve/for-teams'
  },
];

export default function WhoWeServePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testimonialsQuery = query(
      ref(db, 'testimonials'),
      orderByChild('status'),
      equalTo('Approved')
    );
    const unsubscribe = onValue(testimonialsQuery, (snapshot) => {
      const data = snapshot.val();
      setTestimonials(data ? Object.values(data) : []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-8">
          <Link href="/">
            <Logo />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Intro section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Who We Serve
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              From scaling startups to global enterprises, VerticalSync is built for teams of all sizes.
            </p>
          </div>

          {/* Two-column section */}
          <div className="grid gap-12 md:grid-cols-2">
            {/* Business sizes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">By Business Size</h2>
              </div>
              <div className="space-y-5">
                {businessSizes.map((item) => (
                    <Link href={item.href} key={item.title} className="block group">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                    </Link>
                ))}
              </div>
            </div>

            {/* Teams */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Users2 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">By Teams</h2>
              </div>
              <div className="space-y-5">
                {teams.map((item) => (
                  <Link href={item.href} key={item.title} className="block group">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <section className="pt-8 border-t">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : testimonials.length > 0 ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-center">
                  Trusted by Companies Worldwide
                </h2>
                <div className="grid gap-8 sm:grid-cols-2">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="overflow-hidden shadow-sm">
                      <CardContent className="p-6">
                        <blockquote className="text-lg italic text-foreground">
                          "{testimonial.testimonialText}"
                        </blockquote>
                        <footer className="mt-4">
                          <p className="font-semibold">{testimonial.authorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.authorTitle}, {testimonial.companyName}
                          </p>
                        </footer>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No testimonials have been approved yet. Check back soon!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}