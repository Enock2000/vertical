// src/app/employee-portal/components/roster-tab.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { LeaveRequest, RosterAssignment } from '@/lib/data';

interface RosterTabProps {
  rosterAssignments: RosterAssignment[];
  leaveRequests: LeaveRequest[];
}

export function RosterTab({ rosterAssignments, leaveRequests }: RosterTabProps) {
  const eventsByDate = useMemo(() => {
    const events: { [key: string]: { status: RosterAssignment['status'] | 'On Leave' } } = {};

    rosterAssignments.forEach(assignment => {
      events[assignment.date] = { status: assignment.status };
    });

    leaveRequests.forEach(leave => {
      if (leave.status === 'Approved') {
        let currentDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          events[dateKey] = { status: 'On Leave' };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return events;
  }, [rosterAssignments, leaveRequests]);

  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const event = eventsByDate[dateKey];

    let badge: React.ReactNode = null;
    if (event) {
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
      if (event.status === 'On Duty') variant = 'default';
      if (event.status === 'Off Day') variant = 'outline';
      if (event.status === 'On Leave') variant = 'destructive';
      badge = <Badge variant={variant} className="absolute bottom-1 left-1/2 -translate-x-1/2">{event.status}</Badge>;
    }
    
    return (
        <div className="relative h-full w-full">
            {badge}
        </div>
    )
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Roster</CardTitle>
        <CardDescription>Your personal work schedule for the current month.</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          className="p-0 [&_td]:p-0"
          components={{ DayContent: DayContent as any }}
           styles={{
              day: { height: '80px', width: '14.28%', verticalAlign: 'top', position: 'relative' },
              caption_label: { fontSize: '1.25rem' }
            }}
        />
        <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2"><Badge variant="default">On Duty</Badge></div>
            <div className="flex items-center gap-2"><Badge variant="outline">Off Day</Badge></div>
            <div className="flex items-center gap-2"><Badge variant="destructive">On Leave</Badge></div>
        </div>
      </CardContent>
    </Card>
  );
}
