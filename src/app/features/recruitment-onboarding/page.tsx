// src/app/features/recruitment-onboarding/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const recruitmentFeatures = [
  'Post job vacancies to a public careers page.',
  'Create custom application forms for each role.',
  'Track applicants through a visual Kanban board.',
  'AI-powered generation of professional offer letters.',
  'Customizable onboarding checklists for new hires.',
  'Manage applications from external sources.'
];

export default function RecruitmentOnboardingPage() {
  return (
    <div>
      <section className="relative w-full py-20 md:py-28 text-white flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
          alt="Recruitment & Onboarding"
          fill
          className="object-cover"
          priority
          data-ai-hint="hiring team"
        />
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative z-20 container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Recruitment & Onboarding</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-white/80 md:text-xl">
            From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Find and Welcome Top Talent</h2>
                <p className="text-muted-foreground">
                    Streamline your hiring process from start to finish. VerticalSync's recruitment module helps you attract the right candidates, manage applications efficiently, and provide a smooth, professional onboarding experience for your new team members.
                </p>
                <ul className="space-y-4">
                    {recruitmentFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle>A Great First Impression</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop"
                            alt="Welcoming a new team member"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="handshake welcome"
                        />
                        <p className="mt-4 text-muted-foreground">
                           Ensure every new hire feels welcome and prepared. Our onboarding checklists guide new employees through their first days, from signing contracts to setting up equipment.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
