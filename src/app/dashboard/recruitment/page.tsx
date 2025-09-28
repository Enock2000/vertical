// src/app/dashboard/recruitment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobVacancy, Department, Applicant } from '@/lib/data';
import { AddJobDialog } from './components/add-job-dialog';
import { ApplicantsTable } from './components/applicants-table';
import { OnboardingTab } from './components/onboarding-tab';
import { formatDistanceToNow } from 'date-fns';

export default function RecruitmentPage() {
  const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jobsRef = ref(db, 'jobVacancies');
    const deptsRef = ref(db, 'departments');
    const applicantsRef = ref(db, 'applicants');

    let jobsLoaded = false, deptsLoaded = false, applicantsLoaded = false;
    const checkLoading = () => {
      if (jobsLoaded && deptsLoaded && applicantsLoaded) setLoading(false);
    };

    const jobsUnsubscribe = onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      const list: JobVacancy[] = data ? Object.values(data) : [];
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobVacancies(list);
      
      if (!selectedVacancy && list.length > 0) {
        setSelectedVacancy(list[0]);
      } else if (selectedVacancy) {
        // Update selected vacancy if it changed
        const updatedVacancy = list.find(v => v.id === selectedVacancy.id);
        setSelectedVacancy(updatedVacancy || (list.length > 0 ? list[0] : null));
      }

      jobsLoaded = true; checkLoading();
    });

    const deptsUnsubscribe = onValue(deptsRef, (snapshot) => {
      setDepartments(snapshot.val() ? Object.values(snapshot.val()) : []);
      deptsLoaded = true; checkLoading();
    });
    
    const applicantsUnsubscribe = onValue(applicantsRef, (snapshot) => {
        setApplicants(snapshot.val() ? Object.values(snapshot.val()) : []);
        applicantsLoaded = true; checkLoading();
    });

    return () => {
      jobsUnsubscribe();
      deptsUnsubscribe();
      applicantsUnsubscribe();
    };
  }, []);

  const filteredApplicants = applicants.filter(
    (app) => app.jobVacancyId === selectedVacancy?.id
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/* Job Vacancies Column */}
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Vacancies</CardTitle>
              <CardDescription>Manage your open positions.</CardDescription>
            </div>
            <AddJobDialog departments={departments} onJobAdded={() => {}}>
                <Button size="icon" className="h-8 w-8">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </AddJobDialog>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {jobVacancies.map((job) => (
                  <Button
                    key={job.id}
                    variant={selectedVacancy?.id === job.id ? 'secondary' : 'ghost'}
                    className="w-full h-auto justify-start p-3"
                    onClick={() => setSelectedVacancy(job)}
                  >
                    <div className="text-left">
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.departmentName}</p>
                        <p className="text-xs text-muted-foreground">
                            Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Applicant Tracking Column */}
      <Card className="md:col-span-2">
        {selectedVacancy ? (
          <>
            <CardHeader>
              <CardTitle>{selectedVacancy.title}</CardTitle>
              <CardDescription>
                {filteredApplicants.length} applicant(s) for this position.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="applicants">
                    <TabsList>
                        <TabsTrigger value="applicants">Applicants</TabsTrigger>
                        <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                    </TabsList>
                    <TabsContent value="applicants" className="mt-4">
                        <ApplicantsTable applicants={filteredApplicants} vacancy={selectedVacancy} departments={departments} />
                    </TabsContent>
                    <TabsContent value="onboarding" className="mt-4">
                        <OnboardingTab />
                    </TabsContent>
                </Tabs>
            </CardContent>
          </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Vacancy Selected</h3>
                <p className="text-muted-foreground">Select a job vacancy to view applicants or add a new one.</p>
            </div>
        )}
      </Card>
    </div>
  );
}
