// src/app/features/compliance-management/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const complianceFeatures = [
  'AI-powered legal mandate recommendations.',
  'Automated statutory deduction calculations.',
  'Secure record-keeping for audits.',
  'IP-based restrictions for attendance.',
  'Standardized contract generation.',
  'Audit logs for tracking critical system activities.'
];

export default function ComplianceManagementPage() {
  return (
    <div>
      <section className="relative w-full py-20 md:py-28 text-white flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1556761175-577380e2595b?q=80&w=2070&auto=format&fit=crop"
          alt="Compliance Management"
          fill
          className="object-cover"
          priority
          data-ai-hint="business compliance"
        />
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative z-20 container text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Compliance Management</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-white/80 md:text-xl">
            Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Navigate Complexity with Confidence</h2>
                <p className="text-muted-foreground">
                   VerticalSync helps you navigate the complexities of HR compliance in Zambia. Our platform is built with local regulations in mind, automating critical calculations and providing tools to ensure you meet your legal obligations as an employer.
                </p>
                <ul className="space-y-4">
                    {complianceFeatures.map((feature, index) => (
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
                        <CardTitle>Peace of Mind</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop"
                            alt="Person working with peace of mind"
                            width={500}
                            height={400}
                            className="rounded-lg object-cover"
                            data-ai-hint="relaxed professional"
                        />
                        <p className="mt-4 text-muted-foreground">
                           Reduce risks and avoid penalties. Our system provides the framework you need to operate with confidence, knowing your HR processes are built on a compliant foundation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
