// src/app/dashboard/recruitment/components/applicant-kanban-board.tsx
'use client';

import { useMemo } from 'react';
import type { Applicant, Department, JobVacancy } from '@/lib/data';
import { ApplicantStatus } from '@/lib/data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ApplicantCard } from './applicant-card';

const statusOrder: ApplicantStatus[] = [
    'New', 'Screening', 'Interview', 'Offer', 'Onboarding', 'Hired', 'Rejected'
];

interface KanbanColumnProps {
    status: ApplicantStatus;
    applicants: Applicant[];
    vacancy: JobVacancy;
    departments: Department[];
}

function KanbanColumn({ status, applicants, vacancy, departments }: KanbanColumnProps) {
    return (
        <div className="flex flex-col w-72 flex-shrink-0">
            <h3 className="font-semibold text-lg px-2 py-1">{status} <span className="text-muted-foreground text-base">({applicants.length})</span></h3>
            <ScrollArea className="flex-1 rounded-md bg-muted/50 p-2">
                <div className="space-y-2 h-full">
                    {applicants.map(applicant => (
                        <ApplicantCard key={applicant.id} applicant={applicant} vacancy={vacancy} departments={departments} />
                    ))}
                    {applicants.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                            No applicants
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}


interface ApplicantKanbanBoardProps {
  applicants: Applicant[];
  vacancy: JobVacancy;
  departments: Department[];
}

export function ApplicantKanbanBoard({ applicants, vacancy, departments }: ApplicantKanbanBoardProps) {
  
  const columns = useMemo(() => {
      const grouped: { [key in ApplicantStatus]?: Applicant[] } = {};
      for (const applicant of applicants) {
          if (!grouped[applicant.status]) {
              grouped[applicant.status] = [];
          }
          grouped[applicant.status]!.push(applicant);
      }
      return grouped;
  }, [applicants]);

  return (
    <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
            {statusOrder.map(status => (
                <KanbanColumn 
                    key={status}
                    status={status}
                    applicants={columns[status] || []}
                    vacancy={vacancy}
                    departments={departments}
                />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}