import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  CalendarDays, 
  FileText, 
  Send, 
  Target, 
  Megaphone,
  Smartphone,
  Monitor,
  Wifi
} from 'lucide-react';

const selfServiceFeatures = [
  {
    icon: Clock,
    title: 'Smart Attendance',
    desc: 'Clock in and out with IP address validation.',
  },
  {
    icon: CalendarDays,
    title: 'Attendance History',
    desc: 'View personal attendance and leave history.',
  },
  {
    icon: Send,
    title: 'Leave Requests',
    desc: 'Submit leave and resignation requests online.',
  },
  {
    icon: FileText,
    title: 'Digital Payslips',
    desc: 'Access and download monthly payslips instantly.',
  },
  {
    icon: Target,
    title: 'Goals & Performance',
    desc: 'View and track personal performance goals.',
  },
  {
    icon: Megaphone,
    title: 'Company Hub',
    desc: 'Access company announcements and training materials.',
  }
];

export default function EmployeeSelfServicePage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-purple-900 text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container text-center relative z-10">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-800 rounded-full border border-purple-700">
            Employee Portal
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Employee Self-Service
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            Empower your employees with a dedicated portal to manage their attendance, requests, and data—anytime, anywhere.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative & Mobile Access */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-purple-950">
                Empower Your Team
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Reduce administrative overhead and give your employees ownership over their information. The VerticalSync employee portal provides a secure, centralized hub for team members to handle their essential HR tasks.
              </p>
              
              

              <p className="text-slate-600 leading-relaxed">
                By decentralizing routine tasks, you free up your HR team to focus on strategic initiatives rather than data entry.
              </p>
            </div>

            {/* "Accessible Anywhere" Card - Replaces Phone Image */}
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">Accessible Anywhere</h3>
                <p className="text-purple-100/90 leading-relaxed mb-4">
                  Fully responsive design ensures employees can access their portal from their desktop or mobile device.
                </p>
                
                <div className="flex items-center gap-2 text-sm font-medium text-purple-200 bg-purple-900/30 w-fit px-3 py-1.5 rounded-full">
                  <Wifi className="h-3 w-3" />
                  <span>Secure Remote Access</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {selfServiceFeatures.map((feature, index) => (
                <Card key={index} className="border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 group bg-white">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
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