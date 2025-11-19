// src/app/features/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const allFeatures = [
  {
    icon: '📄',
    title: 'Automated Payroll',
    description:
      'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
    details:
      "Say goodbye to manual calculations and spreadsheets. VerticalSync's payroll system is designed to be fast, accurate, and fully compliant with Zambian regulations.",
    imageUrl:
      'https://images.unsplash.com/photo-1565372918674-b4b6fe3eb8c7?q=80&w=2070&auto=format&fit=crop', // Reliable finance/payroll image
    bullets: [
      'Automated tax calculations for PAYE',
      'NAPSA and NHIMA deductions',
      'Direct deposit ACH file generation',
      'Detailed payroll history and payslips',
      'Support for all employee types',
      'Overtime and bonus automation',
    ],
  },
  {
    icon: '🛡️',
    title: 'Compliance Management',
    description:
      'Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.',
    details:
      'VerticalSync helps you navigate complex Zambian HR laws. Automate deductions, generate contracts, and keep your records audit-ready.',
    imageUrl:
      'https://images.unsplash.com/photo-1521790361509-ff8e1e6b88b3?q=80&w=2070&auto=format&fit=crop', // Reliable compliance/legal image
    bullets: [
      'AI-powered legal recommendations',
      'Automated statutory deductions',
      'Secure record-keeping for audits',
      'IP-based attendance validation',
      'Standardized contract templates',
      'Audit logs for system tracking',
    ],
  },
  {
    icon: '💼',
    title: 'Recruitment & Onboarding',
    description:
      'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
    details:
      'Streamline your hiring process and create a professional onboarding experience for new hires.',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
    bullets: [
      'Post job vacancies publicly',
      'Custom application forms',
      'Visual Kanban applicant tracking',
      'AI-generated offer letters',
      'Custom onboarding checklists',
      'Integration with external job sources',
    ],
  },
  {
    icon: '🏆',
    title: 'Performance & Training',
    description:
      'Set goals, track performance, and manage employee training programs with ease.',
    details:
      'Develop your team with structured goals and continuous learning tools that encourage growth.',
    imageUrl:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
    bullets: [
      'Goal tracking and progress indicators',
      '360° feedback reviews',
      'Create and assign training courses',
      'Quiz and certification tracking',
      'Course completion analytics',
      'Employee skill growth insights',
    ],
  },
  {
    icon: '👥',
    title: 'Employee Self-Service',
    description:
      'Empower your employees with a portal to manage their attendance, leave, and payslips.',
    details:
      'Give employees control over their data and requests while reducing HR workload.',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop',
    bullets: [
      'Clock in/out with IP validation',
      'View attendance & leave history',
      'Submit leave & resignation requests',
      'Access payslips and goals',
      'Company news & training materials',
    ],
  },
  {
    icon: '📊',
    title: 'Insightful Reporting',
    description:
      'Get real-time insights into your workforce with reports on headcount, turnover, and more.',
    details:
      'Make smarter HR decisions with real-time analytics dashboards for payroll and workforce trends.',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    bullets: [
      'Headcount & growth tracking',
      'Turnover and retention insights',
      'Diversity analytics by department',
      'Payroll cost breakdowns',
      'Attendance and absenteeism metrics',
      'Performance correlation reports',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Platform Features
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-lg">
              Explore the powerful tools VerticalSync provides to simplify HR
              management.
            </p>
          </div>

          {/* Feature Sections */}
          <div className="space-y-24">
            {allFeatures.map((feature, index) => (
              <section
                key={index}
                id={feature.title.toLowerCase().replace(/ /g, '-')}
                className="scroll-mt-20"
              >
                <div
                  className={cn(
                    'grid items-center gap-10 md:grid-cols-2',
                    index % 2 !== 0 ? 'md:flex-row-reverse' : ''
                  )}
                >
                  {/* Image */}
                  <div className="relative w-full h-[340px] md:h-[400px] overflow-hidden rounded-xl shadow-md">
                    <Image
                      src={feature.imageUrl}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                        {feature.icon}
                      </div>
                      <h2 className="text-3xl font-semibold">
                        {feature.title}
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-lg">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.bullets.map((bullet, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm md:text-base"
                        >
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Divider */}
                {index < allFeatures.length - 1 && (
                  <div className="mt-12 border-b border-muted/30" />
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
