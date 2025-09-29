// src/app/employee-portal/components/roster-tab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from 'date-fns';
import type { LeaveRequest, RosterAssignment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RosterTabProps {
  rosterAssignments: RosterAssignment[];
  leaveRequests: LeaveRequest[];
}

export function RosterTab({ rosterAssignments, leaveRequests }: RosterTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
  
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>My Roster</CardTitle>
                <CardDescription>Your personal work schedule for {format(currentMonth, 'MMMM yyyy')}.</CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {days.map(day => (
                            <TableHead key={day.toString()} className="text-center">
                                <div className={cn("flex flex-col items-center", isToday(day) && "text-primary")}>
                                    <span className="text-xs">{weekDays[getDay(day)]}</span>
                                    <span>{format(day, 'd')}</span>
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                         {days.map(day => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const event = eventsByDate[dateKey];
                            let variant: "default" | "secondary" | "destructive" | "outline" | null = null;
                            let text = 'N/A';

                            if (event) {
                                if (event.status === 'On Duty') { variant = 'default'; text = 'Duty'; }
                                else if (event.status === 'Off Day') { variant = 'outline'; text = 'Off'; }
                                else if (event.status === 'On Leave') { variant = 'destructive'; text = 'Leave'; }
                            }
                            
                            return (
                                <TableCell key={day.toString()} className="text-center p-2">
                                    {variant ? (
                                            <Badge variant={variant}>{text}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">{text}</span>
                                    )}
                                </TableCell>
                            )
                        })}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
         <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2"><Badge variant="default">On Duty</Badge></div>
            <div className="flex items-center gap-2"><Badge variant="outline">Off Day</Badge></div>
            <div className="flex items-center gap-2"><Badge variant="destructive">On Leave</Badge></div>
        </div>
      </CardContent>
    </Card>
  );
}
