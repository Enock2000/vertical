import { Card, CardContent } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  Lock, 
  History, 
  Calculator,
  Gavel,
  FileKey
} from 'lucide-react';

const complianceFeatures = [
  {
    icon: Scale,
    title: 'Legal Intelligence',
    desc: 'AI-powered legal mandate recommendations.',
  },
  {
    icon: Calculator,
    title: 'Statutory Automation',
    desc: 'Automated statutory deduction calculations.',
  },
  {
    icon: FileKey,
    title: 'Secure Records',
    desc: 'Secure record-keeping for audits.',
  },
  {
    icon: Lock,
    title: 'Access Control',
    desc: 'IP-based restrictions for attendance.',
  },
  {
    icon: FileText,
    title: 'Smart Contracts',
    desc: 'Standardized contract generation.',
  },
  {
    icon: History,
    title: 'Audit Trails',
    desc: 'Audit logs for tracking critical system activities.',
  }
];

export default function ComplianceManagementPage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-purple-900 text-white flex items-center justify-center relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-purple-400 blur-3xl"></div>
          <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-indigo-400 blur-3xl"></div>
        </div>
        
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-800/50 rounded-full border border-purple-700">
            <ShieldCheck className="h-3 w-3" />
            <span>Risk Mitigation</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Compliance Management
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            Stay compliant with local labor laws and tax regulations. Our AI-powered engine adapts to changes so you don't have to.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative & Context */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-purple-950 leading-tight">
                Navigate Complexity with Confidence
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                VerticalSync helps you navigate the complexities of HR compliance in Zambia. Our platform is built with local regulations in mind, automating critical calculations.
              </p>
              
              [Image of regulatory compliance workflow]

              <p className="text-slate-600 leading-relaxed">
                From automated statutory deductions to audit-ready record keeping, we provide the tools to ensure you meet your legal obligations as an employer without the administrative burden.
              </p>
            </div>

            {/* "Peace of Mind" Highlight Box */}
            <Card className="bg-purple-900 text-white border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-700 rounded-full opacity-50 blur-2xl"></div>
              <CardContent className="pt-8 pb-8 px-8 relative z-10">
                <div className="mb-4 p-3 bg-purple-800 inline-block rounded-xl">
                  <Gavel className="h-8 w-8 text-purple-200" />
                </div>
                <h3 className="text-xl font-bold mb-3">Peace of Mind</h3>
                <p className="text-purple-100/90 leading-relaxed">
                  Reduce risks and avoid penalties. Our system provides the framework you need to operate with confidence, knowing your HR processes are built on a compliant foundation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {complianceFeatures.map((feature, index) => (
                <Card key={index} className="border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 group bg-white">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-5 p-3 bg-purple-50 w-fit rounded-lg group-hover:bg-purple-100 transition-colors">
                      <feature.icon className="h-6 w-6 text-purple-700" />
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