// src/app/features/performance-training/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const performanceFeatures = [
  'Set and track individual employee goals with progress indicators.',
  'Conduct performance reviews and gather 360-degree feedback.',
  'Create custom training courses with quizzes.',
  'Enroll employees in specific training modules.',
  'Track course completion and scores.',
  'Record and manage employee certifications and expiry dates.'
];

export default function PerformanceTrainingPage() {
  return (
    <div>
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 text-gray-900 flex items-center justify-center">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Performance & Training</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-gray-700/80 md:text-xl">
            Set goals, track performance with 360-degree feedback, and manage employee training programs.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Invest in Your People</h2>
                <p className="text-muted-foreground">
                    Develop your talent and build a high-performance culture. VerticalSync provides the tools to set clear expectations, provide constructive feedback, and deliver targeted training to help your employees grow and succeed.
                </p>
                <ul className="space-y-4">
                    {performanceFeatures.map((feature, index) => (
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
                        <CardTitle>Continuous Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1974&auto=format&fit=crop"
                            alt="Team celebrating success"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="team success"
                        />
                        <p className="mt-4 text-muted-foreground">
                           From tracking individual goals to company-wide training initiatives, our platform supports a culture of continuous improvement and professional development.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
