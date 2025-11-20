import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  PieChart, 
  DollarSign, 
  LineChart,
  Presentation
} from 'lucide-react';

const reportingFeatures = [
  {
    icon: Users,
    title: 'Headcount Analysis',
    desc: 'Track employee headcount and growth trends over time.',
  },
  {
    icon: TrendingUp,
    title: 'Turnover Metrics',
    desc: 'Analyze turnover rates with new hire vs. separation data.',
  },
  {
    icon: PieChart,
    title: 'Diversity Insights',
    desc: 'Visualize workforce diversity and department distribution.',
  },
  {
    icon: DollarSign,
    title: 'Cost Monitoring',
    desc: 'Monitor payroll costs by department and role.',
  },
  {
    icon: BarChart3,
    title: 'Attendance Reports',
    desc: 'Generate deep-dive reports on attendance and absenteeism.',
  },
  {
    icon: LineChart,
    title: 'Performance Correlation',
    desc: 'Correlate training hours with performance improvements.',
  }
];

export default function InsightfulReportingPage() {
  return (
    <div className="min-h-screen bg-purple-50/30">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-purple-950 text-white flex items-center justify-center relative overflow-hidden">
        {/* Abstract Data Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d8b4fe_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-purple-200 uppercase bg-purple-900/50 rounded-full border border-purple-700">
            <BarChart3 className="h-3 w-3" />
            <span>Business Intelligence</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6">
            Insightful Reporting
          </h1>
          <p className="mx-auto max-w-[700px] text-purple-100 md:text-xl leading-relaxed">
            Transform raw data into strategic power. Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and costs.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative & Visuals */}
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-purple-950">
                Data-Driven Decisions
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                VerticalSync's reporting dashboard provides a comprehensive overview of your most important metrics, helping you make informed decisions about your workforce strategy.
              </p>
              
              

              <p className="text-slate-600 leading-relaxed">
                Spot trends instantly with our easy-to-understand charts and graphs. Identify potential issues before they escalate and share key findings with stakeholders in seconds.
              </p>
            </div>

            {/* Feature Highlight Box */}
            <Card className="bg-white border-purple-100 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <CardContent className="pt-6 pb-6 pl-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                    <Presentation className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-950 text-lg mb-2">Executive Ready</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Export board-ready PDF reports or schedule automated email summaries to keep leadership aligned without manual effort.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Metric Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {reportingFeatures.map((feature, index) => (
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
