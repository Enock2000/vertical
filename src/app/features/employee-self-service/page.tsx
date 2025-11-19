// src/app/features/employee-self-service/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const selfServiceFeatures = [
  'Clock in and out with IP address validation.',
  'View personal attendance and leave history.',
  'Submit leave and resignation requests online.',
  'Access and download monthly payslips.',
  'View and track personal performance goals.',
  'Access company announcements and training materials.'
];

export default function EmployeeSelfServicePage() {
  return (
    <div>
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 text-gray-900 flex items-center justify-center">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Employee Self-Service</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-gray-700/80 md:text-xl">
            Empower your employees with a portal to manage their attendance, leave, and view payslips.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Empower Your Team</h2>
                <p className="text-muted-foreground">
                    Reduce administrative overhead and give your employees ownership over their information. The VerticalSync employee portal provides a secure, centralized hub for team members to handle their essential HR tasks, freeing up your HR team to focus on strategic initiatives.
                </p>
                <ul className="space-y-4">
                    {selfServiceFeatures.map((feature, index) => (
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
                        <CardTitle>Accessible Anywhere</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1581090122119-037095c73528?q=80&w=2070&auto=format&fit=crop"
                            alt="Person using a phone"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="mobile technology"
                        />
                        <p className="mt-4 text-muted-foreground">
                           With a fully responsive design, employees can access their portal from their desktop or mobile device, ensuring they have the information they need, when they need it.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
