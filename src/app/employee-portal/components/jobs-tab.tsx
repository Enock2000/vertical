'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, Building2 } from 'lucide-react';
import type { JobVacancy } from '@/lib/data';

interface JobsTabProps {
  jobs: JobVacancy[];
}

export function JobsTab({ jobs }: JobsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Jobs</CardTitle>
        <CardDescription>
          Explore internal opportunities to grow within the company.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> {job.departmentName}
                      </p>
                    </div>
                     <Button>Apply Now</Button>
                  </div>
                   <p className="text-sm mt-2 text-muted-foreground line-clamp-3">
                        {job.description}
                    </p>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No internal jobs available at the moment.</p>
                <p className="text-sm text-muted-foreground">Check back later for new opportunities!</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
