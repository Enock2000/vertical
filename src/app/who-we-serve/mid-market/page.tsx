// src/app/who-we-serve/mid-market/page.tsx
import Image from 'next/image';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';

const features = [
    'Scale payroll and HR processes across multiple countries.',
    'Consolidate global payroll into a single, manageable platform.',
    'Advanced reporting and analytics to track workforce trends.',
    'Integrate with your existing finance and accounting software.',
    'Dedicated support to help you manage your growing complexity.'
];

export default function MidMarketPage() {
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
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                    alt="Mid-Market Business"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="growing business team"
                />
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <div className="relative z-20 container text-center">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">For Mid-Market Companies</h1>
                <p className="mx-auto mt-4 max-w-[700px] text-white/80 md:text-xl">
                    As you scale, your HR needs become more complex. VerticalSync provides the robust tools you need to manage a growing international team efficiently.
                </p>
                </div>
            </section>

             <section className="container py-16 md:py-24">
                <div className="mx-auto max-w-4xl space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Streamline and Scale</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Your business is expanding, and your HR platform should too. Move beyond basic tools and consolidate your global operations onto a single platform built for scale.
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
