// src/app/who-we-serve/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import type { Testimonial } from '@/lib/data';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import Image from 'next/image';

export default function WhoWeServePage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const testimonialsQuery = query(ref(db, 'testimonials'), orderByChild('status'), equalTo('Approved'));
        const unsubscribe = onValue(testimonialsQuery, (snapshot) => {
            const data = snapshot.val();
            setTestimonials(data ? Object.values(data) : []);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
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
            <main className="flex-1 py-12">
                <div className="container">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Who We Serve</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            Hear from some of the amazing companies that trust VerticalSync to manage their HR needs.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : testimonials.length > 0 ? (
                        <div className="mx-auto max-w-4xl grid gap-8">
                            {testimonials.map((testimonial) => (
                                <Card key={testimonial.id} className="overflow-hidden">
                                    <CardContent className="p-6">
                                        <blockquote className="text-lg italic text-foreground">
                                            "{testimonial.testimonialText}"
                                        </blockquote>
                                        <footer className="mt-4">
                                            <p className="font-semibold">{testimonial.authorName}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.authorTitle}, {testimonial.companyName}</p>
                                        </footer>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <p>No testimonials have been approved yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
