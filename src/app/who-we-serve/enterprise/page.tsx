import { ThumbsUp, Lock, Star, Check, Flag, ArrowLeft, TrendingUp, DollarSign, Users, ShieldCheck, Zap } from "lucide-react";
import Link from 'next/link';
// Assuming Logo and Button are replaced by standard Tailwind/JSX elements for a single-file context.

// Mock data for the key benefits/features
const enterpriseBenefits = [
  {
    icon: Lock,
    title: 'Advanced Security & Compliance',
    description: 'Ensure global regulatory adherence and data protection with enterprise-grade security protocols.',
  },
  {
    icon: ShieldCheck,
    title: 'Customizable Workflows',
    description: 'Tailor HR processes, approvals, and reporting hierarchies to match your organizational structure.',
  },
  {
    icon: TrendingUp,
    title: 'Strategic Workforce Analytics',
    description: 'Access real-time dashboards to analyze global headcount, cost, and retention trends.',
  },
  {
    icon: Star,
    title: 'Dedicated Account Manager',
    description: 'Receive premium, dedicated support and consultation from a global expert team.',
  },
];

export default function EnterprisePage() {
  // Mock component replacements for simplicity and robustness
  const MockLogo = () => (
    <div className="text-xl font-bold text-purple-900 flex items-center gap-1">
      <Zap className="h-5 w-5 text-purple-600 fill-purple-200" />
      VerticalSync <span className="text-purple-600 font-extrabold">E</span>
    </div>
  );
  
  const MockButton = ({ children, variant = 'primary', size = 'lg', className = '' }) => {
    let baseClasses = "font-semibold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl";
    if (variant === 'primary') {
      baseClasses += " bg-purple-700 text-white hover:bg-purple-800 focus:ring-4 focus:ring-purple-300";
    } else if (variant === 'outline') {
      baseClasses += " border border-purple-700 text-purple-700 bg-white hover:bg-purple-50 focus:ring-4 focus:ring-purple-200";
    } else if (variant === 'ghost') {
      baseClasses = "font-semibold py-2 px-4 rounded-lg transition duration-300 text-purple-700 hover:bg-purple-100";
    }
    return <a className={`${baseClasses} ${className}`}>{children}</a>;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-800">
      {/* ========== Header ========== */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <MockLogo />
          </Link>
          <MockButton variant="ghost" size="sm" className="px-4 py-2 text-sm">
            <Link href="/who-we-serve" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Who We Serve
            </Link>
          </MockButton>
        </div>
      </header>

      {/* ========== Hero Section ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 py-24 md:py-32">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200 opacity-50 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-1 md:items-center"> {/* Changed to 1 column */}
            {/* Left: Text & CTA - Now spans full width */}
            <div className="max-w-2xl mx-auto text-center"> {/* Centered content */}
              <p className="text-sm font-bold uppercase tracking-widest text-purple-600">
                Enterprise Solution
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-tight text-purple-950 md:text-6xl">
                Run your <span className="text-purple-700">Global Workforce</span> with Precision and Control
              </h1>
              <p className="mt-6 text-xl text-purple-800/80">
                Connect enterprise payroll, compliance, contractors, and more in one unified platform. Achieve maximum efficiency, reduce operational costs, and streamline complex HR operations for your largest teams.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center"> {/* Centered buttons */}
                <MockButton variant="primary">
                  Request Enterprise Demo
                </MockButton>
                <MockButton variant="outline">
                  Contact Sales Team
                </MockButton>
              </div>
            </div>

            {/* Right: Mock UI Dashboard - REMOVED */}
            {/* The previous mock dashboard UI has been removed as per instructions. */}
            
          </div>
        </div>
      </section>

      {/* ========== Features Section ========== */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-purple-950">
              The Enterprise Advantage
            </h2>
            <p className="mt-4 text-lg text-purple-800/80">
              Scale without complexity. VerticalSync provides the necessary tools and dedicated infrastructure for high-volume, regulated global operations.
            </p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {enterpriseBenefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-start p-6 bg-purple-50 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-purple-100">
                <div className="p-3 mb-4 rounded-full bg-purple-600 text-white">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-3">{benefit.title}</h3>
                <p className="text-base text-purple-800/90">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ========== Footer (Minimal) ========== */}
      <footer className="bg-purple-950 py-10">
        <div className="container mx-auto text-center text-purple-200">
          <p className="text-sm">
            © 2024 VerticalSync Inc. All rights reserved. For Enterprise inquiries, please contact sales directly.
          </p>
        </div>
      </footer>
    </div>
  );
}
