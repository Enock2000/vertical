// src/app/documentation/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { ArrowLeft, BarChart, Briefcase, CalendarCheck, ClipboardCheck, FileText, Landmark, Megaphone, Network, ShieldCheck, Settings, Trophy, Users } from 'lucide-react';
import React from 'react';

const features = [
    { 
        icon: <Users />, 
        title: "Employee Management", 
        description: "Add, edit, and manage all employee records, including personal details, roles, compensation, and status (Active, On Leave, etc.). The system supports various worker types like Salaried, Hourly, and Contractors." 
    },
    { 
        icon: <Briefcase />, 
        title: "Recruitment & Onboarding", 
        description: "Handle the entire hiring process from posting job vacancies to tracking applicants through various stages (New, Screening, Interview, Offer, Hired). Includes AI-powered offer letter generation and a customizable onboarding checklist for new hires." 
    },
    { 
        icon: <FileText />, 
        title: "Payroll Processing", 
        description: "Run payroll for all active employees with a single click. The system automatically calculates gross pay, statutory deductions (NAPSA, NHIMA), income tax (PAYE), and net pay. It also generates an ACH-compatible CSV file for bank transfers and maintains a full history of all payroll runs with downloadable PDF payslips." 
    },
    { 
        icon: <Landmark />, 
        title: "Payment Methods", 
        description: "Securely manage employee bank details, including bank name, account number, and branch code, to ensure accurate and timely payroll processing." 
    },
    { 
        icon: <CalendarCheck />, 
        title: "Leave & Resignation Management", 
        description: "Employees can request leave and submit resignations through their portal. Admins can view a full history, approve or reject requests, and track leave balances." 
    },
    { 
        icon: <ClipboardCheck />, 
        title: "Attendance & Roster", 
        description: "Employees can clock in/out via their portal. The system intelligently checks the daily roster to mark employees as 'Absent' only if they are scheduled to work, otherwise showing 'Off Day' or 'On Leave'. Admins can manage shifts and view detailed attendance records."
    },
    { s
        icon: <Trophy />, 
        title: "Performance Management", 
        description: "Set and track individual employee goals, initiate performance reviews, and collect 360-degree feedback. Manage a training catalog with quiz-based courses and track employee certifications." 
    },
    {
        icon: <Megaphone />,
        title: "Announcements",
        description: "Create and publish company-wide or department-specific announcements. Keep your team informed with a centralized communication hub accessible via the employee portal."
    },
    { 
        icon: <BarChart />, 
        title: "Reporting & Analytics", 
        description: "Visualize key HR data with charts for employee headcount over time, turnover rates (new hires vs. separations), payroll costs, attendance trends, and workforce diversity." 
    },
    { 
        icon: <Network />, 
        title: "Organization Structure", 
        description: "Define your company's structure by creating departments with specific salary ranges and configuring roles with granular permissions to control access to different system modules." 
    },
    { 
        icon: <ShieldCheck />, 
        title: "Compliance Advisor", 
        description: "Leverage an AI-powered assistant to get recommendations for legal and compliance mandates based on employee location and contract details, helping you stay compliant with local regulations." 
    },
    { 
        icon: <Settings />, 
        title: "Settings", 
        description: "Configure payroll parameters like tax rates, contribution percentages, overtime multipliers, and manage the list of banks available for payroll processing. Customize subscription plans and manage job posting availability." 
    }
];


export default function DocumentationPage() {
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
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">VerticalSync Documentation</h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                            A comprehensive guide to all features available in the VerticalSync HR platform.
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl space-y-8">
                       {features.map((feature, index) => (
                           <Card key={index}>
                               <CardHeader className="flex flex-row items-center gap-4">
                                   <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        {React.cloneElement(feature.icon, { className: "h-6 w-6" })}
                                   </div>
                                   <div>
                                       <CardTitle>{feature.title}</CardTitle>
                                   </div>
                               </CardHeader>
                               <CardContent>
                                   <p className="text-muted-foreground">{feature.description}</p>
                               </CardContent>
                           </Card>
                       ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
