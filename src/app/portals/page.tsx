// src/app/portals/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/logo';

const portalCards = [
  {
    icon: <Building className="h-10 w-10" />,
    title: 'Admin Portal',
    description: 'Manage employees, run payroll, and oversee all HR functions for your company.',
    href: '/login',
    bgColor: 'bg-blue-600',
    keyFeatures: [
      'Employee Management',
      'Payroll & Compliance',
      'Recruitment & Onboarding'
    ]
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: 'Employee & Applicant Portal',
    description: 'Access your personal dashboard, view payslips, request leave, and track job applications.',
    href: '/employee-login',
    bgColor: 'bg-green-600',
    keyFeatures: [
      'Clock In/Out',
      'View Payslips',
      'Apply for Jobs'
    ]
  },
  {
    icon: <Briefcase className="h-10 w-10" />,
    title: 'Guest Employer Portal',
    description: 'Post job openings and track applicants for your positions. Upgrade anytime to access full features.',
    href: '/employee-login',
    bgColor: 'bg-purple-600',
    keyFeatures: [
        'Post Job Vacancies',
        'View Applicants',
        'Simple Account Management'
    ]
  }
];

export default function PortalSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="absolute top-6 left-6">
            <Link href="/">
                <Logo />
            </Link>
        </div>
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Choose Your Portal</h1>
            <p className="mt-2 text-lg text-muted-foreground">Select the portal that matches your role to continue.</p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {portalCards.map((card) => (
                <Card key={card.title} className="flex flex-col overflow-hidden transition-transform hover:scale-105">
                    <div className={`p-8 text-white ${card.bgColor}`}>
                        <div className="mb-4">{card.icon}</div>
                        <CardTitle className="text-2xl text-white">{card.title}</CardTitle>
                        <CardDescription className="text-white/80 mt-2">{card.description}</CardDescription>
                    </div>
                    <CardContent className="flex-1 space-y-4 p-6 bg-background">
                        <h4 className="font-semibold text-sm">Key Features:</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {card.keyFeatures.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${card.bgColor}`} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <div className="bg-background p-6 pt-0">
                         <Button asChild className="w-full">
                            <Link href={card.href}>
                                Access Portal <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
}
