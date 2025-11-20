import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, 
  FileEdit, 
  LayoutGrid, 
  MailOpen, 
  ListChecks, 
  Import,
  Users,
  Handshake
} from 'lucide-react';

const recruitmentFeatures = [
  {
    icon: Briefcase,
    title: 'Public Careers Page',
    desc: 'Post job vacancies directly to a dedicated, public careers page.',
  },
  {
    icon: FileEdit,
    title: 'Custom Application Forms',
    desc: 'Create custom application forms for each role with specific requirements.',
  },
  {
    icon: LayoutGrid,
    title: 'Visual Applicant Tracking',
    desc: 'Track applicants through a visual Kanban board, moving candidates easily through stages.',
  },
  {
    icon: MailOpen,
    title: 'AI Offer Generation',
    desc: 'AI-powered generation of professional, customizable offer letters.',
  },
  {
    icon: ListChecks,
    title: 'Onboarding Checklists',
    desc: 'Customizable onboarding checklists for new hires, ensuring no step is missed.',
  },
  {
    icon: Import,
    title: 'External Sourcing',
    desc: 'Manage applications imported from various external job boards and sources.',
  }
];

export default function RecruitmentOnboardingPage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-purple-900 text-white flex items-center justify-center relative overflow-hidden">
        {/* Background gradient for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
        
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-800/50 rounded-full border border-purple-700">
            <Users className="h-3 w-3" />
            <span>Talent Acquisition</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Recruitment & Onboarding
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            From job vacancy to successful new hire, manage your entire talent pipeline efficiently and professionally in one integrated system.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative & Context */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-purple-950">
                Find and Welcome Top Talent
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Streamline your hiring process from start to finish. VerticalSync's recruitment module helps you attract the right candidates, manage applications efficiently, and deliver a seamless experience.
              </p>
              
              

              <p className="text-slate-600 leading-relaxed">
                By providing clarity and automation at every stage, you can focus on making the best hiring decisions and reducing your time-to-hire metric.
              </p>
            </div>

            {/* Highlight Card: A Great First Impression */}
            <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-none shadow-xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl shrink-0">
                    <Handshake className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">A Great First Impression</h3>
                    <p className="text-purple-100/90 text-sm leading-relaxed">
                      Ensure every new hire feels welcome and prepared. Our customizable onboarding checklists guide new employees through their first days, minimizing administrative friction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {recruitmentFeatures.map((feature, index) => (
                <Card key={index} className="border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-400 transition-all duration-300 group bg-white">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-700 group-hover:text-white transition-colors duration-300">
                        <feature.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="font-bold text-purple-950 mb-2 text-lg">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
