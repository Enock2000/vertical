// src/app/dashboard/roster/components/roster-calendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from 'date-fns';
import type { Employee, LeaveRequest, RosterAssignment, Shift } from '@/lib/data';
import { AssignStatusDialog } from '../../organization/components/assign-status-dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RosterCalendarProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  rosterAssignments: RosterAssignment[];
  shifts: Shift[];
}

export function RosterCalendar({ employees, leaveRequests, rosterAssignments, shifts }: RosterCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const eventsByDateAndEmployee = useMemo(() => {
    const events: { [key: string]: RosterAssignment | { status: 'On Leave' } } = {};
    const key = (date: string, employeeId: string) => `${date}-${employeeId}`;

    rosterAssignments.forEach(assignment => {
      events[key(assignment.date, assignment.employeeId)] = assignment;
    });

    leaveRequests.forEach(leave => {
        if (leave.status === 'Approved') {
            let currentDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            while (currentDate <= endDate) {
                const dateKey = format(currentDate, 'yyyy-MM-dd');
                events[key(dateKey, leave.employeeId)] = { status: 'On Leave' };
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
    const event = eventsByDateAndEmployee[`${dateKey}-${selectedEmployee.id}`];
    if (event && 'id' in event) { // Check if it's a RosterAssignment
        return event as RosterAssignment;
    }
    return null;
  }, [selectedDate, selectedEmployee, eventsByDateAndEmployee]);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
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

        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px] sticky left-0 bg-background z-10">Employee</TableHead>
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
                    {employees.map(employee => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10">{employee.name}</TableCell>
                            {days.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const event = eventsByDateAndEmployee[`${dateKey}-${employee.id}`] as RosterAssignment | { status: 'On Leave' };
                                
                                let content;
                                if (event) {
                                    if (event.status === 'On Duty') {
                                        content = (
                                            <div className="p-1 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: event.shiftColor || 'hsl(var(--primary))' }}>
                                                {event.shiftName || 'Duty'}
                                            </div>
                                        );
                                    } else if (event.status === 'Off Day') {
                                        content = <div className="text-xs text-muted-foreground">Off</div>;
                                    } else if (event.status === 'On Leave') {
                                        content = (
                                            <div className="p-1 rounded-md text-xs font-semibold bg-destructive text-destructive-foreground">
                                                Leave
                                            </div>
                                        );
                                    }
                                } else {
                                    content = <div className="text-xs text-muted-foreground">-</div>;
                                }
                                
                                return (
                                    <TableCell key={day.toString()} className="text-center p-1 cursor-pointer hover:bg-muted" onClick={() => handleDayClick(employee, day)}>
                                        {content}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        
        <AssignStatusDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            employee={selectedEmployee}
            date={selectedDate}
            assignment={currentAssignment}
            shifts={shifts}
        />
    </div>
  );
}
