// src/app/features/insightful-reporting/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const reportingFeatures = [
  'Track employee headcount and growth over time.',
  'Analyze turnover rates with new hire vs. separation data.',
  'Visualize workforce diversity and department distribution.',
  'Monitor payroll costs by department.',
  'Generate reports on attendance, leave, and absenteeism.',
  'Correlate training hours with performance improvements.'
];

export default function InsightfulReportingPage() {
  return (
    <div>
      <section className="relative w-full py-20 md:py-28 text-white flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
          alt="Insightful Reporting"
          fill
          className="object-cover"
          priority
          data-ai-hint="data charts"
        />
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative z-20 container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Insightful Reporting</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-white/80 md:text-xl">
            Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and more.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Data-Driven Decisions</h2>
                <p className="text-muted-foreground">
                    Transform your HR data into actionable insights. VerticalSync's reporting dashboard provides a comprehensive overview of your most important metrics, helping you make informed decisions about your workforce strategy, budget, and company culture.
                </p>
                <ul className="space-y-4">
                    {reportingFeatures.map((feature, index) => (
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
                        <CardTitle>Clear Visualizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=2070&auto=format&fit=crop"
                            alt="Charts and graphs"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="graphs charts"
                        />
                        <p className="mt-4 text-muted-foreground">
                           Our easy-to-understand charts and graphs make it simple to spot trends, identify potential issues, and share key findings with stakeholders.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
