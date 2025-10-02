// src/app/employee-portal/components/leave-history-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { columns } from './leave-columns';
import type { LeaveRequest } from '@/lib/data';
import { EmployeeLeaveRequestDialog } from './employee-leave-request-dialog';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';

interface LeaveHistoryTabProps {
  leaveRequests: LeaveRequest[];
}

export function LeaveHistoryTab({ leaveRequests }: LeaveHistoryTabProps) {
  const { employee } = useAuth();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>My Leave History</CardTitle>
            <CardDescription>
            A log of all your past and pending leave requests.
            </CardDescription>
        </div>
        {employee && (
            <EmployeeLeaveRequestDialog employee={employee}>
                <Button>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    New Leave Request
                </Button>
            </EmployeeLeaveRequestDialog>
        )}
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={leaveRequests} />
      </CardContent>
    </Card>
  );
}
