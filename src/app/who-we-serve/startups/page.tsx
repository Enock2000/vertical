// src/app/who-we-serve/startups/page.tsx
import Image from 'next/image';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';

const features = [
    'Automated payroll and compliance for your first international hires.',
    'Simple, scalable HR tools that grow with you.',
    'Cost-effective plans designed for lean budgets.',
    'Fast onboarding to get your global team productive quickly.',
    'Access to essential reporting to track your growth.'
];

export default function StartupsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
            <Link href="/">
                <Logo />
            </Link>
            <Button variant="ghost" asChild>
                <Link href="/who-we-serve">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Who We Serve
                </Link>
            </Button>
            </div>
        </header>

        <main className="flex-1">
            <section className="relative w-full py-20 md:py-28 text-white flex items-center justify-center">
                <Image
                    src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                    alt="Startups"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="startup team working"
                />
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <div className="relative z-20 container text-center">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">For Startups</h1>
                <p className="mx-auto mt-4 max-w-[700px] text-white/80 md:text-xl">
                    Go global from day one. VerticalSync gives you the tools to hire, pay, and manage talent anywhere in the world, without the administrative burden.
                </p>
                </div>
            </section>

             <section className="container py-16 md:py-24">
                <div className="mx-auto max-w-4xl space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Focus on Growth, Not Paperwork</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            As a startup, your focus should be on building your product and finding market fit. VerticalSync handles the complexities of international HR, so you can build a global team with confidence.
                        </p>
                    </div>

                    <ul className="space-y-4 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-4">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    </div>
  );
}
