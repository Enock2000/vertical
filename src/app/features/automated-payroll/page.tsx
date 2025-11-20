import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calculator, Landmark, FileText, Users, Clock, Briefcase } from 'lucide-react';

// Enhanced data structure for better visual presentation
const features = [
  {
    icon: Calculator,
    title: 'Smart Tax Engine',
    desc: 'Automated tax calculations for PAYE.',
  },
  {
    icon: Landmark,
    title: 'Statutory Compliance',
    desc: 'Auto-deductions for NAPSA and NHIMA.',
  },
  {
    icon: FileText,
    title: 'Instant Payslips',
    desc: 'Detailed payroll history and digital slips.',
  },
  {
    icon: Briefcase,
    title: 'Bank Integration',
    desc: 'Direct deposit ACH file generation.',
  },
  {
    icon: Users,
    title: 'Flexible Workforce',
    desc: 'Support for salaried, hourly, and contract workers.',
  },
  {
    icon: Clock,
    title: 'Time & Attendance',
    desc: 'Configurable overtime and bonus calculations.',
  },
];

export default function AutomatedPayrollPage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-purple-950 text-white flex items-center justify-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#581c87_1px,transparent_1px),linear-gradient(to_bottom,#581c87_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        
        <div className="container text-center relative z-10">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-900 rounded-full">
            Finance & Operations
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Automated Payroll
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically so you never miss a deadline.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative Content */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-purple-950">
                Effortless & Accurate Processing
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Say goodbye to manual calculations and spreadsheets. VerticalSync's payroll system is designed to be fast, accurate, and fully compliant with Zambian regulations.
              </p>
              
              

              <p className="text-slate-600 leading-relaxed">
                From generating payslips to creating bank transfer files, every step is simplified to save you time and prevent costly errors.
              </p>
            </div>

            {/* "Focus" Box - Replaces the old Image Card */}
            <Card className="bg-purple-100 border-purple-200 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-600 rounded-lg text-white shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 text-lg mb-2">Focus on What Matters</h3>
                    <p className="text-purple-800/80 text-sm leading-relaxed">
                      With payroll automated, you can focus on growing your business and supporting your team, knowing that everyone will be paid accurately and on time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 group">
                  <CardContent className="p-6">
                    <feature.icon className="h-8 w-8 text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-semibold text-purple-950 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.desc}</p>
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
