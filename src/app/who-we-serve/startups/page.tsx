import { CheckCircle, ArrowLeft, Zap, Rocket, DollarSign, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Mock replacements for assumed external components
const MockLogo = () => (
  <div className="text-xl font-bold text-purple-900 flex items-center gap-1">
    <Zap className="h-5 w-5 text-purple-600 fill-purple-200" />
    VerticalSync
  </div>
);

const MockButton = ({ children, variant = 'primary', size = 'lg', className = '', asChild = false }) => {
  let baseClasses = "font-semibold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl";
  if (variant === 'primary') {
    baseClasses += " bg-purple-700 text-white hover:bg-purple-800 focus:ring-4 focus:ring-purple-300";
  } else if (variant === 'outline') {
    baseClasses += " border border-purple-700 text-purple-700 bg-white hover:bg-purple-50 focus:ring-4 focus:ring-purple-200";
  } else if (variant === 'ghost') {
    baseClasses = "font-semibold py-2 px-4 rounded-lg transition duration-300 text-purple-700 hover:bg-purple-100";
  }

  if (asChild) {
      return (
        <div className={`${baseClasses} ${className}`}>
            {children}
        </div>
      )
  }
  
  return <a className={`${baseClasses} ${className}`}>{children}</a>;
};


const features = [
    'Automated payroll and compliance for your first international hires.',
    'Simple, scalable HR tools that grow with you.',
    'Cost-effective plans designed for lean budgets.',
    'Fast onboarding to get your global team productive quickly.',
    'Access to essential reporting to track your growth.'
];

// New mock data for value pillars
const pillars = [
    { icon: Rocket, title: 'Rapid Deployment', description: 'Go from zero to global team in under 48 hours.' },
    { icon: DollarSign, title: 'Startup Pricing', description: 'Affordable, transparent fees built for lean, growing businesses.' },
    { icon: Clock, title: 'Time Savings', description: 'Automate all compliance and payment tasks, freeing up your team.' },
    { icon: TrendingUp, title: 'Scalable Infrastructure', description: 'Seamlessly transition to enterprise-level functionality when you grow.' },
];

export default function StartupsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ========== Header ========== */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <MockLogo />
          </Link>
          <MockButton variant="ghost" className="px-4 py-2 text-sm" asChild>
            <Link href="/who-we-serve" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Who We Serve
            </Link>
          </MockButton>
        </div>
      </header>
      {/* ========== End Header ========== */}

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 py-24 md:py-36">
            <div className="relative z-10 container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <div className="inline-block">
                            <span className="text-purple-600 font-bold text-sm tracking-widest uppercase">For Startups</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-purple-950 leading-tight">
                            Fast track your growth and <span className="text-purple-700">automate everything</span>
                        </h1>
                        <p className="text-lg text-purple-800/80">
                            Grow your startup faster with VerticalSync. Hire the best talent in 150 countries in minutes, without worrying about compliance, payroll or HR admin.
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex gap-4 pt-6">
                            <MockButton size="lg" variant="primary">
                                Get a free demo
                            </MockButton>
                            <MockButton size="lg" variant="outline">
                                Speak to sales
                            </MockButton>
                        </div>
                    </div>

                    {/* Right Visual Placeholder (Replaces Image) */}
                    <div className="relative aspect-[4/3] w-full p-8 rounded-2xl bg-white border-4 border-purple-300/50 shadow-2xl flex justify-center items-center">
                        <div className="w-full max-w-sm p-6 bg-purple-50 rounded-xl border border-purple-200 shadow-lg">
                            <div className="text-center mb-4">
                                <Rocket className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-purple-900">Global Onboarding Widget</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="h-3 bg-purple-300 rounded-full w-4/5"></div>
                                <div className="h-3 bg-purple-400 rounded-full w-3/5"></div>
                                <div className="h-3 bg-purple-300 rounded-full w-1/2"></div>
                            </div>
                            <p className="mt-4 text-xs text-purple-700/80 text-center">
                                Zero-touch compliance status for new hires.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Features & Pillars Section */}
        <section className="py-20 md:py-28 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <h2 className="text-4xl font-extrabold text-purple-950">
                        Focus on Growth, Not Paperwork
                    </h2>
                    <p className="mt-4 text-lg text-gray-700">
                        As a startup, your focus should be on building your product and finding market fit. VerticalSync handles the complexities of international HR, so you can build a global team with confidence.
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
                    {pillars.map((pillar, index) => (
                        <div key={index} className="flex flex-col items-start p-6 bg-purple-50 rounded-xl border-t-4 border-purple-600 shadow-lg">
                            <div className="p-3 mb-4 rounded-full bg-purple-600/10 text-purple-700">
                                <pillar.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-purple-950 mb-2">{pillar.title}</h3>
                            <p className="text-base text-gray-700">{pillar.description}</p>
                        </div>
                    ))}
                </div>

                {/* Detailed Features List */}
                <div className="mx-auto max-w-3xl">
                    <ul className="space-y-6 p-6 rounded-xl bg-purple-50/70 border border-purple-200">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-purple-700 mt-1 flex-shrink-0" />
                                <span className="text-lg text-gray-800 font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
      </main>

      {/* ========== Footer (Minimal) ========== */}
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