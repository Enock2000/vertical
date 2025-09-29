// src/app/dashboard/roster/components/roster-calendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Employee, LeaveRequest, RosterAssignment } from '@/lib/data';
import { AssignStatusDialog } from './assign-status-dialog';

interface RosterCalendarProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  rosterAssignments: RosterAssignment[];
}

export function RosterCalendar({ employees, leaveRequests, rosterAssignments }: RosterCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const eventsByDate = useMemo(() => {
    const events: { [key: string]: (RosterAssignment | LeaveRequest)[] } = {};

    rosterAssignments.forEach(assignment => {
      const dateKey = assignment.date;
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push(assignment);
    });

    leaveRequests.forEach(leave => {
        if (leave.status === 'Approved') {
            let currentDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            while (currentDate <= endDate) {
                const dateKey = format(currentDate, 'yyyy-MM-dd');
                if (!events[dateKey]) events[dateKey] = [];
                events[dateKey].push({ ...leave, date: dateKey, status: 'On Leave' } as any);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    });

    return events;
  }, [rosterAssignments, leaveRequests]);

  const handleDayClick = (employee: Employee, day: Date) => {
    setSelectedEmployee(employee);
    setSelectedDate(day);
    setIsDialogOpen(true);
  };
  
  const currentAssignment = useMemo(() => {
    if (!selectedDate || !selectedEmployee) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return rosterAssignments.find(a => a.date === dateKey && a.employeeId === selectedEmployee.id) || null;
  }, [selectedDate, selectedEmployee, rosterAssignments]);

  const DayContent = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || [];
    
    return (
        <div className="h-full w-full">
            <div className="absolute top-1 right-1 text-xs">{format(day, 'd')}</div>
            <div className="mt-4 space-y-1 p-1">
                 {employees.map(employee => {
                    const event = dayEvents.find(e => e.employeeId === employee.id);
                    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                    let text = 'N/A';
                    if (event) {
                        if (event.status === 'On Duty') { variant = 'default'; text = 'Duty'; }
                        else if (event.status === 'Off Day') { variant = 'outline'; text = 'Off'; }
                        else if (event.status === 'On Leave') { variant = 'destructive'; text = 'Leave'; }
                    }

                    return (
                        <div key={employee.id} onClick={() => handleDayClick(employee, day)} className="cursor-pointer">
                             <Badge variant={variant} className="w-full justify-center truncate">{text}</Badge>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 p-4 border rounded-md h-fit">
            <h3 className="font-semibold mb-2">Employees</h3>
            <ul className="space-y-2">
            {employees.map(employee => (
                <li key={employee.id} className="text-sm p-2 rounded-md bg-muted">
                    {employee.name}
                </li>
            ))}
            </ul>
        </div>
        <div className="md:col-span-3">
             <Calendar
                mode="single"
                className="p-0 [&_td]:p-0 [&_tr]:border-0 [&_tbody]:divide-y-0"
                components={{
                    DayContent: ({ date }) => DayContent(date),
                }}
                styles={{
                    head_cell: { width: '14.28%', textAlign: 'center' },
                    day: { height: '120px', width: '14.28%', verticalAlign: 'top', border: '1px solid hsl(var(--border))' },
                    table: { width: '100%', borderCollapse: 'collapse' },
                }}
            />
        </div>
        <AssignStatusDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            employee={selectedEmployee}
            date={selectedDate}
            assignment={currentAssignment}
        />
    </div>
  );
}
