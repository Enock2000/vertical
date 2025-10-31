
// src/app/features/page.tsx
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Briefcase, ShieldCheck, Trophy, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

const allFeatures = [
    { 
        icon: <FileText />, 
        title: "Automated Payroll", 
        description: "Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.",
        details: "Say goodbye to manual calculations and spreadsheets. VerticalSync's payroll system is designed to be fast, accurate, and fully compliant with Zambian regulations. From generating payslips to creating bank transfer files, every step is simplified to save you time and prevent costly errors.",
        imageUrl: "https://images.unsplash.com/photo-1579621970795-87f91d908377?q=80&w=2070&auto=format&fit=crop",
        imageHint: "money currency",
        bullets: [
            'Automated tax calculations for PAYE.',
            'Statutory deductions for NAPSA and NHIMA.',
            'Direct deposit ACH file generation.',
            'Detailed payroll history and payslips.',
            'Support for salaried, hourly, and contract workers.',
            'Configurable overtime and bonus calculations.'
        ]
    },
    { 
        icon: <ShieldCheck />, 
        title: "Compliance Management", 
        description: "Stay compliant with local labor laws and tax regulations with our AI-powered compliance engine.",
        details: "VerticalSync helps you navigate the complexities of HR compliance in Zambia. Our platform is built with local regulations in mind, automating critical calculations and providing tools to ensure you meet your legal obligations as an employer.",
        imageUrl: "https://images.unsplash.com/photo-1556761175-577380e2595b?q=80&w=2070&auto=format&fit=crop",
        imageHint: "business compliance",
        bullets: [
            'AI-powered legal mandate recommendations.',
            'Automated statutory deduction calculations.',
            'Secure record-keeping for audits.',
            'IP-based restrictions for attendance.',
            'Standardized contract generation.',
            'Audit logs for tracking critical system activities.'
        ]
    },
    { 
        icon: <Briefcase />, 
        title: "Recruitment & Onboarding", 
        description: "From job vacancy to onboarding checklist, manage your entire hiring pipeline in one place.",
        details: "Streamline your hiring process from start to finish. VerticalSync's recruitment module helps you attract the right candidates, manage applications efficiently, and provide a smooth, professional onboarding experience for your new team members.",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
        imageHint: "hiring team",
        bullets: [
            'Post job vacancies to a public careers page.',
            'Create custom application forms for each role.',
            'Track applicants through a visual Kanban board.',
            'AI-powered generation of professional offer letters.',
            'Customizable onboarding checklists for new hires.',
            'Manage applications from external sources.'
        ]
    },
    { 
        icon: <Trophy />, 
        title: "Performance & Training", 
        description: "Set goals, track performance, and manage employee training programs with ease.",
        details: "Develop your talent and build a high-performance culture. VerticalSync provides the tools to set clear expectations, provide constructive feedback, and deliver targeted training to help your employees grow and succeed.",
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop",
        imageHint: "presentation training",
        bullets: [
            'Set and track individual employee goals with progress indicators.',
            'Conduct performance reviews and gather 360-degree feedback.',
            'Create custom training courses with quizzes.',
            'Enroll employees in specific training modules.',
            'Track course completion and scores.',
            'Record and manage employee certifications and expiry dates.'
        ]
    },
    { 
        icon: <Users />, 
        title: "Employee Self-Service", 
        description: "Empower your employees with a portal to manage their attendance, leave, and view payslips.",
        details: "Reduce administrative overhead and give your employees ownership over their information. The VerticalSync employee portal provides a secure, centralized hub for team members to handle their essential HR tasks, freeing up your HR team to focus on strategic initiatives.",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
        imageHint: "team empowerment",
        bullets: [
            'Clock in and out with IP address validation.',
            'View personal attendance and leave history.',
            'Submit leave and resignation requests online.',
            'Access and download monthly payslips.',
            'View and track personal performance goals.',
            'Access company announcements and training materials.'
        ]
    },
    { 
        icon: <BarChart3 />, 
        title: "Insightful Reporting", 
        description: "Get real-time insights into your workforce with comprehensive reports on headcount, turnover, and more.",
        details: "Transform your HR data into actionable insights. VerticalSync's reporting dashboard provides a comprehensive overview of your most important metrics, helping you make informed decisions about your workforce strategy, budget, and company culture.",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        imageHint: "data charts",
        bullets: [
            'Track employee headcount and growth over time.',
            'Analyze turnover rates with new hire vs. separation data.',
            'Visualize workforce diversity and department distribution.',
            'Monitor payroll costs by department.',
            'Generate reports on attendance, leave, and absenteeism.',
            'Correlate training hours with performance improvements.'
        ]
    },
];

export default function FeaturesPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12">
                <div className="container">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Platform Features</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            A comprehensive overview of the powerful tools VerticalSync offers to streamline your HR processes.
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl space-y-12">
                       {allFeatures.map((feature, index) => (
                           <section key={index} id={feature.title.toLowerCase().replace(/ /g, '-')} className="space-y-6 scroll-mt-20">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                         <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            {React.cloneElement(feature.icon, { className: "h-6 w-6" })}
                                        </div>
                                        <h2 className="text-3xl font-bold">{feature.title}</h2>
                                    </div>
                                    <p className="text-lg text-muted-foreground">{feature.description}</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="relative aspect-video">
                                        <Image
                                            src={feature.imageUrl}
                                            alt={feature.title}
                                            fill
                                            className="rounded-lg object-cover"
                                            data-ai-hint={feature.imageHint}
                                        />
                                    </div>
                                    <ul className="space-y-3">
                                        {feature.bullets.map((bullet, bulletIndex) => (
                                            <li key={bulletIndex} className="flex items-start gap-3">
                                                <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                           </section>
                       ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
