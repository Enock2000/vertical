import { ThumbsUp, Lock, Star, ArrowLeft, Zap, Globe, DollarSign, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Mock replacements for assumed external components
const MockLogo = () => (
  <div className="text-xl font-bold text-purple-900 flex items-center gap-1">
    <Zap className="h-5 w-5 text-purple-600 fill-purple-200" />
    VerticalSync
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


// Mock data for key value propositions
const valueProps = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Hire and manage talent in over 150 countries with local compliance baked in.',
  },
  {
    icon: DollarSign,
    title: 'Cost Efficiency',
    description: 'Consolidate payroll systems to reduce overhead and save on local provider costs.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Compliance',
    description: 'Ensure statutory adherence and minimize risk with continuously updated legal templates.',
  },
];


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ========== Header (DO NOT CHANGE) ========== */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <MockLogo />
          </Link>
          <MockButton variant="ghost" className="px-4 py-2 text-sm">
            <Link href="/who-we-serve" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Who We Serve
            </Link>
          </MockButton>
        </div>
      </header>
      {/* ========== End Header ========== */}

      {/* ---------- Hero ---------- */}
      <section className="relative flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 py-24 md:py-36">
        {/* Abstract Background Element */}
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-purple-200 opacity-50 blur-[150px] pointer-events-none"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Copy */}
            <h1 className="text-5xl font-extrabold leading-snug text-purple-950 md:text-7xl">
              The ultimate people platform for <span className="text-purple-700">Scaling Companies</span>
            </h1>
            <p className="mt-8 text-xl text-purple-800/80 max-w-3xl mx-auto">
              Unlock efficiency with global reach. VerticalSync streamlines payroll, HR, and compliance for your entire workforce, allowing you to scale globally with confidence and control.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col gap-4 sm:flex-row justify-center">
              <MockButton variant="primary">
                Get a free demo
              </MockButton>
              <MockButton variant="outline">
                Speak to sales
              </MockButton>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* ---------- Value Proposition / Features Section ---------- */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            {valueProps.map((prop, index) => (
              <div key={index} className="flex flex-col items-center p-6 rounded-xl border border-purple-100 shadow-md hover:shadow-xl transition duration-300 bg-white">
                <div className="p-4 mb-4 rounded-full bg-purple-100 text-purple-600">
                  <prop.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-3">{prop.title}</h3>
                <p className="text-base text-gray-700 max-w-xs">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Footer (Minimal) ---------- */}
      <footer className="bg-purple-950 py-10">
        <div className="container mx-auto text-center text-purple-200">
          <p className="text-sm">
            © 2024 VerticalSync Inc. All rights reserved. 
          </p>
        </div>
      </footer>
    </div>
  );
}
