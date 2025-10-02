// src/app/dashboard/recruitment/components/onboarding-tab.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Applicant } from '@/lib/data';
import { OnboardingChecklist } from './onboarding-checklist';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OnboardingTabProps {
  applicants: Applicant[];
}

export function OnboardingTab({ applicants }: OnboardingTabProps) {
  const onboardingApplicants = useMemo(() => 
    applicants.filter(a => a.status === 'Onboarding'),
    [applicants]
  );
  
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    onboardingApplicants.length > 0 ? onboardingApplicants[0] : null
  );

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Onboarding Employees</CardTitle>
          <CardDescription>Select an employee to manage their onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {onboardingApplicants.length > 0 ? (
              onboardingApplicants.map(applicant => (
                <Button
                  key={applicant.id}
                  variant={selectedApplicant?.id === applicant.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedApplicant(applicant)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${applicant.email}.png`} />
                    <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {applicant.name}
                </Button>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                No employees are currently onboarding.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="md:col-span-2">
        {selectedApplicant ? (
          <OnboardingChecklist key={selectedApplicant.id} applicant={selectedApplicant} />
        ) : (
           <Card className="flex items-center justify-center h-full">
             <div className="text-center text-muted-foreground p-8">
                <p>Select an employee to view their onboarding checklist.</p>
             </div>
           </Card>
        )}
      </div>
    </div>
  );
}
