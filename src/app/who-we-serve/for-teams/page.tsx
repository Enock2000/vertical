// src/app/who-we-serve/for-teams/page.tsx
import Image from 'next/image';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';

const teamsData = [
  {
    title: 'For HR Teams',
    subtitle: 'Your single source of truth for global HR.',
    description: 'Stop juggling multiple systems. VerticalSync brings all your employee data, onboarding, and compliance management into one platform, so you can focus on building a great team.',
    imageUrl: 'https://images.unsplash.com/photo-1573496397914-50892433543b?q=80&w=2069&auto=format&fit=crop',
    imageHint: 'HR team meeting',
    features: [
      'Centralized employee records',
      'Automated onboarding workflows',
      'Global compliance management',
      'Insightful workforce analytics'
    ]
  },
  {
    title: 'For Finance Teams',
    subtitle: 'Simplify global payroll and reduce costs.',
    description: 'Consolidate payroll for all your international employees into a single payment. Get a clear overview of your global workforce costs and eliminate the need for multiple local payroll providers.',
    imageUrl: 'https://images.unsplash.com/photo-1630049337861-c3938634710a?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'finance team charts',
    features: [
      'Consolidated global payroll',
      'Real-time cost reporting',
      'Automated tax and statutory deductions',
      'Integration with accounting software'
    ]
  },
  {
    title: 'For Legal Teams',
    subtitle: 'Ensure compliance in every country.',
    description: 'Hire internationally with confidence. VerticalSync helps you generate locally compliant contracts and stay up-to-date with changing labor laws, minimizing risk and ensuring you meet your legal obligations everywhere you operate.',
    imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beace7a2044?q=80&w=2070&auto=format&fit=crop',
    imageHint: 'legal books gavel',
    features: [
      'AI-powered compliance recommendations',
      'Localized contract templates',
      'Secure document storage',
      'Comprehensive audit trails'
    ]
  }
];

export default function ForTeamsPage() {
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

        <main className="flex-1 py-16 md:py-24">
            <div className="container max-w-6xl space-y-24">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Built for Every Team</h1>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                        VerticalSync empowers HR, Finance, and Legal teams to work together seamlessly on a unified global platform.
                    </p>
                </div>

                {teamsData.map((team, index) => (
                    <div key={team.title} className={`grid items-center gap-10 md:grid-cols-2 ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                        <div className={`relative aspect-video w-full overflow-hidden rounded-xl shadow-md ${index % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                            <Image
                                src={team.imageUrl}
                                alt={team.title}
                                fill
                                className="object-cover"
                                data-ai-hint={team.imageHint}
                            />
                        </div>
                        <div className="space-y-5">
                            <h2 className="text-3xl font-semibold">{team.title}</h2>
                            <p className="text-muted-foreground text-lg">{team.subtitle}</p>
                            <p className="text-muted-foreground">{team.description}</p>
                            <ul className="space-y-2">
                                {team.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        </main>
    </div>
  );
}
