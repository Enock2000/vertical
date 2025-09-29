
// src/app/dashboard/recruitment/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { PlusCircle, Loader2, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobVacancy, Department, Applicant } from '@/lib/data';
import { AddJobDialog } from './components/add-job-dialog';
import { ApplicantsTable } from './components/applicants-table';
import { OnboardingTab } from './components/onboarding-tab';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/app/auth-provider';

export default function RecruitmentPage() {
  const { companyId } = useAuth();
  const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
    const deptsRef = ref(db, `companies/${companyId}/departments`);
    const applicantsRef = ref(db, `companies/${companyId}/applicants`);

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
        setApplicants(snapshot.val() ? Object.keys(snapshot.val()).map(key => ({...snapshot.val()[key], id: key})) : []);
        applicantsLoaded = true; checkLoading();
    });

    return () => {
      jobsUnsubscribe();
      deptsUnsubscribe();
      applicantsUnsubscribe();
    };
  }, [companyId]);

  const filteredApplicants = useMemo(() => applicants.filter(
    (app) => app.jobVacancyId === selectedVacancy?.id
  ), [applicants, selectedVacancy]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
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

      <Card className="md:col-span-2">
        <Tabs defaultValue="applicants" className="h-full flex flex-col">
            {selectedVacancy ? (
            <>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{selectedVacancy.title}</CardTitle>
                            <CardDescription>
                                {filteredApplicants.length} applicant(s) for this position.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <TabsList>
                                <TabsTrigger value="applicants">Applicants</TabsTrigger>
                                <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                            </TabsList>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/jobs/${selectedVacancy.id}?companyId=${companyId}`} target="_blank">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                    View Job
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <TabsContent value="applicants" className="mt-0">
                        <ApplicantsTable applicants={filteredApplicants} vacancy={selectedVacancy} departments={departments} />
                    </TabsContent>
                    <TabsContent value="onboarding" className="mt-0">
                        <OnboardingTab applicants={applicants} />
                    </TabsContent>
                </CardContent>
            </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Vacancy Selected</h3>
                    <p className="text-muted-foreground">Select a job vacancy to view applicants or add a new one.</p>
                </div>
            )}
        </Tabs>
      </Card>
    </div>
  );
}
