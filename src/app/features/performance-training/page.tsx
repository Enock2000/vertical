import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  Trophy, 
  CalendarCheck,
  Zap,
  Star
} from 'lucide-react';

const performanceFeatures = [
  {
    icon: Target,
    title: 'Goal Management',
    desc: 'Set and track individual employee goals with progress indicators.',
  },
  {
    icon: Users,
    title: '360° Feedback',
    desc: 'Conduct performance reviews and gather comprehensive 360-degree feedback.',
  },
  {
    icon: GraduationCap,
    title: 'Custom LMS',
    desc: 'Create custom training courses, quizzes, and learning paths.',
  },
  {
    icon: ClipboardCheck,
    title: 'Enrollment Tracking',
    desc: 'Enroll employees in specific training modules and monitor progress.',
  },
  {
    icon: Trophy,
    title: 'Certification Management',
    desc: 'Record and manage employee certifications and expiry dates.',
  },
  {
    icon: CalendarCheck,
    title: 'Review Scheduling',
    desc: 'Automate performance review scheduling and notification processes.',
  }
];

export default function PerformanceTrainingPage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-gradient-to-tr from-purple-800 to-indigo-900 text-white flex items-center justify-center relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-15 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
          <div className="absolute top-1/4 left-1/4 h-32 w-32 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-700/50 rounded-full border border-purple-600">
            <Zap className="h-3 w-3" />
            <span>Talent Development</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Performance & Training
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            Drive high-performance through clear goal setting, continuous feedback loops, and a fully integrated learning management system.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative & Context */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-purple-950">
                Invest in Your People
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Develop your talent and build a high-performance culture effortlessly. VerticalSync provides the tools to set clear expectations and provide constructive, frequent feedback.
              </p>
              
              [Image of performance review lifecycle diagram]

              <p className="text-slate-600 leading-relaxed">
                Our platform delivers targeted training to help your employees grow and succeed, turning skill gaps into skill strengths.
              </p>
            </div>

            {/* "Continuous Growth" Card - Replaces Image */}
            <Card className="bg-purple-100 border-purple-200 shadow-md">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-600 rounded-lg text-white shrink-0">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg mb-2">Foster Continuous Growth</h3>
                    <p className="text-purple-800/80 text-sm leading-relaxed">
                      Track individual goals, manage training initiatives, and support a culture of professional development that aligns directly with company success.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {performanceFeatures.map((feature, index) => (
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
