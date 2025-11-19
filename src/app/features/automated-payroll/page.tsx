// src/app/features/automated-payroll/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const payrollFeatures = [
  'Automated tax calculations for PAYE.',
  'Statutory deductions for NAPSA and NHIMA.',
  'Direct deposit ACH file generation.',
  'Detailed payroll history and payslips.',
  'Support for salaried, hourly, and contract workers.',
  'Configurable overtime and bonus calculations.'
];

export default function AutomatedPayrollPage() {
  return (
    <div>
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 text-gray-900 flex items-center justify-center">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Automated Payroll</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-gray-700/80 md:text-xl">
            Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Effortless & Accurate Payroll</h2>
                <p className="text-muted-foreground">
                    Say goodbye to manual calculations and spreadsheets. VerticalSync's payroll system is designed to be fast, accurate, and fully compliant with Zambian regulations. From generating payslips to creating bank transfer files, every step is simplified to save you time and prevent costly errors.
                </p>
                <ul className="space-y-4">
                    {payrollFeatures.map((feature, index) => (
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
                        <CardTitle>Focus on What Matters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
                            alt="Person focusing on work"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="business analytics"
                        />
                        <p className="mt-4 text-muted-foreground">
                            With payroll automated, you can focus on growing your business and supporting your team, knowing that everyone will be paid accurately and on time.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
