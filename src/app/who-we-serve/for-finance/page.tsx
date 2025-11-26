// src/app/who-we-serve/for-finance/page.tsx

import { ArrowLeft, DollarSign, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';

const features = [
  'Consolidated global payroll',
  'Real-time cost reporting',
  'Automated tax and statutory deductions',
  'Integration with accounting software'
];

export default function ForFinancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Logo />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/who-we-serve" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Who We Serve
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-white">
          <div className="container max-w-6xl space-y-4 mx-auto text-center">
             <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                <DollarSign className="h-4 w-4" />
                <span>For Finance Teams</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl text-purple-950">
              Simplify Global Payroll and Reduce Costs
            </h1>
            <p className="mx-auto mt-4 max-w-[800px] text-lg text-purple-800/80 md:text-xl">
              Consolidate payroll for all your international employees into a single payment. Get a clear overview of your global workforce costs and eliminate the need for multiple local payroll providers.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-4xl space-y-12">
            <h2 className="text-3xl font-bold text-center text-purple-950">Key Capabilities</h2>
            <ul className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-purple-600 mt-1" />
                  <span className="text-lg text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-purple-950 py-10">
        <div className="container mx-auto text-center text-purple-200">
          <p className="text-sm">© 2024 VerticalSync Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
