
'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const allFeatures = [
  {
    icon: '📄',
    title: 'Automated Payroll',
    description:
      'Run payroll in minutes. We handle taxes, compliance, and direct deposits automatically.',
    bullets: [
      'Automated tax calculations for PAYE',
      'NAPSA and NHIMA deductions',
      'Direct deposit ACH file generation',
      'Detailed payroll history and payslips',
      '+ 2 more features',
    ],
    href: '/features/automated-payroll',
  },
  {
    icon: '🛡️',
    title: 'Compliance Management',
    description:
      'Stay compliant with local labor laws and tax regulations with our AI-powered engine.',
    bullets: [
      'AI-powered legal recommendations',
      'Automated statutory deductions',
      'Secure record-keeping for audits',
      'IP-based attendance validation',
      '+ 2 more features',
    ],
    href: '/features/compliance-management',
  },
  {
    icon: '💼',
    title: 'Recruitment & Onboarding',
    description:
      'From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.',
    bullets: [
      'Post job vacancies publicly',
      'Custom application forms',
      'Visual Kanban applicant tracking',
      'AI-generated offer letters',
      '+ 2 more features',
    ],
    href: '/features/recruitment-onboarding',
  },
  {
    icon: '🏆',
    title: 'Performance & Training',
    description:
      'Set goals, track performance, and manage employee training programs with ease.',
    bullets: [
      'Goal tracking and progress indicators',
      '360° feedback reviews',
      'Create and assign training courses',
      'Quiz and certification tracking',
    ],
     href: '/features/performance-training',
  },
  {
    icon: '👥',
    title: 'Employee Self-Service',
    description:
      'Empower your employees with a portal to manage their attendance, leave, and payslips.',
    bullets: [
      'Clock in/out with IP validation',
      'View attendance & leave history',
      'Submit leave & resignation requests',
      'Access payslips and goals',
    ],
    href: '/features/employee-self-service',
  },
  {
    icon: '📊',
    title: 'Insightful Reporting',
    description:
      'Get real-time insights into your workforce with reports on headcount, turnover, and more.',
    bullets: [
      'Headcount & growth tracking',
      'Turnover and retention insights',
      'Diversity analytics by department',
      'Payroll cost breakdowns',
    ],
    href: '/features/insightful-reporting',
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-purple-50/30">
      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-800 mb-4">
              <span>Everything you need</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-purple-950 sm:text-5xl md:text-6xl">
              Platform Features
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Explore the powerful tools <span className="text-purple-700 font-semibold">VerticalSync</span> provides to simplify HR management and automate your workflows.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allFeatures.map((feature, index) => (
              <Link href={feature.href} key={index} className="block group">
                <div
                  
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50 h-full"
                >
                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-3xl shadow-inner ring-1 ring-inset ring-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>

                  {/* Text Content */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-purple-950 group-hover:text-purple-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="mt-auto border-t border-purple-50 pt-6">
                    <ul className="space-y-3">
                      {feature.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-purple-600" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
