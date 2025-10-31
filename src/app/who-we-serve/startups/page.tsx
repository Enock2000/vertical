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
    <div className="flex min-h-screen flex-col">
        {/* Top Banner */}
        <div className="bg-purple-900 text-white py-3">
            <div className="container flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded font-semibold text-sm">LIVE WEBINAR</span>
                    <span className="text-sm">Scattered reviews waste time. Learn how better performance management drives business ROI.</span>
                </div>
                <Button variant="ghost" className="bg-white text-purple-900 hover:bg-gray-100 text-sm px-4 py-1 h-auto rounded">
                    Register now
                </Button>
            </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/">
                    <Logo />
                </Link>
                <nav className="flex items-center gap-6">
                    <Button variant="ghost" asChild>
                        <Link href="/who-we-serve">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <Button variant="outline">Log in</Button>
                    <Button className="bg-purple-900 hover:bg-purple-800">Book a demo</Button>
                </nav>
            </div>
        </header>

        {/* Trust Bar */}
        <div className="bg-purple-900 text-white py-4">
            <div className="container flex items-center justify-center gap-12 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Trusted by 35,000+ companies</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400">★★★★★</span>
                    <span>10,000+ reviews</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    <span>Advanced data security</span>
                </div>
            </div>
        </div>

        {/* Hero Section */}
        <main className="flex-1 bg-gradient-to-br from-yellow-200 via-yellow-100 to-orange-100">
            <div className="container py-16 md:py-24">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-block">
                            <span className="text-purple-900 font-semibold text-sm tracking-wide uppercase">For Startups</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                            Fast track your growth and automate everything
                        </h1>
                        <p className="text-lg text-gray-700">
                            Grow your startup faster with VerticalSync. <Link href="#" className="text-purple-900 underline font-semibold">Hire the best talent</Link> in 150 countries in minutes, without worrying about compliance, <Link href="#" className="text-purple-900 underline font-semibold">payroll</Link> or HR admin.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <Button size="lg" className="bg-purple-900 hover:bg-purple-800 text-white px-8">
                                Get a free 30 minute demo
                            </Button>
                            <Button size="lg" variant="outline" className="border-purple-900 text-purple-900 hover:bg-purple-50">
                                Speak to sales
                            </Button>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative">
                        <Image
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop"
                            alt="Professional working on tablet"
                            width={600}
                            height={700}
                            className="rounded-lg shadow-2xl"
                            priority
                        />
                        {/* Floating Stats Cards */}
                        <div className="absolute top-8 left-8 bg-white rounded-lg shadow-xl p-4 max-w-[200px]">
                            <div className="text-xs text-gray-600 mb-2">New joiners</div>
                            <div className="text-2xl font-bold mb-2">2,648</div>
                            <div className="flex gap-1">
                                <div className="w-full h-16 bg-yellow-200 rounded"></div>
                                <div className="w-full h-20 bg-yellow-300 rounded"></div>
                                <div className="w-full h-24 bg-yellow-400 rounded"></div>
                                <div className="w-full h-28 bg-yellow-500 rounded"></div>
                            </div>
                        </div>
                        <div className="absolute bottom-8 left-8 bg-white rounded-lg shadow-xl p-4">
                            <div className="text-xs text-gray-600 mb-2">TOTAL PAYMENTS</div>
                            <div className="text-3xl font-bold">$340,800</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        {/* Features Section */}
        <section className="container py-16 md:py-24 bg-white">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Focus on Growth, Not Paperwork</h2>
                    <p className="mt-4 text-lg text-gray-600">
                        As a startup, your focus should be on building your product and finding market fit. VerticalSync handles the complexities of international HR, so you can build a global team with confidence.
                    </p>
                </div>

                <ul className="space-y-4 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-4 mt-12">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-purple-900 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    </div>
  );
}