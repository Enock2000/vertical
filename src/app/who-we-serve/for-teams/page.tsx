import { CheckCircle, ArrowLeft, Users, DollarSign, Scale, Zap } from 'lucide-react';
import Link from 'next/link';

// Mock replacements for assumed external components
const MockLogo = () => (
  <div className="text-xl font-bold text-purple-900 flex items-center gap-1">
    <Zap className="h-5 w-5 text-purple-600 fill-purple-200" />
    VerticalSync
  </div>
);

const MockButton = ({ children, variant = 'ghost', asChild = false, className = '' }) => {
  let baseClasses = "font-semibold py-2 px-4 rounded-lg transition duration-300";
  if (variant === 'ghost') {
    baseClasses += " text-purple-700 hover:bg-purple-100";
  }
  
  // If asChild is true, we assume Link provides the wrapper
  const Wrapper = asChild ? 'span' : 'a';

  return <Wrapper className={`${baseClasses} ${className}`}>{children}</Wrapper>;
};

const teamsData = [
  {
    title: 'For HR Teams',
    subtitle: 'Your single source of truth for global HR.',
    description: 'Stop juggling multiple systems. VerticalSync brings all your employee data, onboarding, and compliance management into one platform, so you can focus on building a great team.',
    icon: Users,
    features: [
      'Centralized employee records',
      'Automated onboarding workflows',
      'Global compliance management',
      'Insightful workforce analytics'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'For Finance Teams',
    subtitle: 'Simplify global payroll and reduce costs.',
    description: 'Consolidate payroll for all your international employees into a single payment. Get a clear overview of your global workforce costs and eliminate the need for multiple local payroll providers.',
    icon: DollarSign,
    features: [
      'Consolidated global payroll',
      'Real-time cost reporting',
      'Automated tax and statutory deductions',
      'Integration with accounting software'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-white',
  },
  {
    title: 'For Legal Teams',
    subtitle: 'Ensure compliance in every country.',
    description: 'Hire internationally with confidence. VerticalSync helps you generate locally compliant contracts and stay up-to-date with changing labor laws, minimizing risk and ensuring you meet your legal obligations everywhere you operate.',
    icon: Scale,
    features: [
      'AI-powered compliance recommendations',
      'Localized contract templates',
      'Secure document storage',
      'Comprehensive audit trails'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  }
];

export default function ForTeamsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ========== Header (DO NOT CHANGE) ========== */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <MockLogo />
          </Link>
          <MockButton variant="ghost" asChild>
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
        <section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-white">
          <div className="container max-w-6xl space-y-4 mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl text-purple-950">
              Built for <span className="text-purple-700">Every Team</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[800px] text-lg text-purple-800/80 md:text-xl">
              VerticalSync empowers HR, Finance, and Legal teams to work together seamlessly on a unified global platform, driving efficiency and compliance across your entire organization.
            </p>
          </div>
        </section>

        {/* Teams Feature Blocks */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl space-y-16">

            {teamsData.map((team, index) => (
              <div 
                key={team.title} 
                className={`p-8 md:p-12 rounded-3xl shadow-xl transition-shadow duration-300 ${team.bgColor} border border-purple-100`}
              >
                <div className={`grid items-center gap-8 lg:gap-16 md:grid-cols-2 ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                  
                  {/* Text Content */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <team.icon className={`h-8 w-8 ${team.color} p-1 rounded-lg bg-purple-200/50`} />
                        <h2 className="text-3xl font-bold text-purple-950">{team.title}</h2>
                    </div>
                    
                    <p className={`text-xl font-medium ${team.color} border-l-4 border-purple-400 pl-4`}>
                        {team.subtitle}
                    </p>
                    <p className="text-lg text-gray-700">{team.description}</p>
                    
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3">Key Capabilities:</h3>
                        <ul className="space-y-3">
                            {team.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <CheckCircle className={`h-5 w-5 ${team.color} flex-shrink-0 mt-1`} />
                                    <span className="text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                  </div>

                  {/* Visual Placeholder (Replaces Image) */}
                  <div className={`relative aspect-[4/3] w-full p-6 rounded-2xl border-4 border-purple-300/50 flex flex-col justify-center items-center ${index % 2 !== 0 ? 'md:col-start-2' : ''} bg-purple-100/70`}>
                    <div className="text-center">
                        <team.icon className="h-12 w-12 text-purple-500 mb-4" />
                        <p className="text-lg font-semibold text-purple-900">
                            Centralized {team.title.split(' ')[1]} Dashboard
                        </p>
                        <p className="text-sm text-purple-700/80 mt-1">
                            A focused visual representation of core data and workflows.
                        </p>
                    </div>
                    {/* Mock Chart/Data Element */}
                    <div className="mt-6 flex gap-3 w-3/4">
                        <div className="flex-1 h-3 bg-purple-400 rounded-full"></div>
                        <div className="w-1/4 h-3 bg-purple-300 rounded-full"></div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
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
