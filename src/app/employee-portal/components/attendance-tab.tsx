'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { columns } from './attendance-columns';
import type { AttendanceRecord } from '@/lib/data';

interface AttendanceTabProps {
  attendanceRecords: AttendanceRecord[];
}

export function AttendanceTab({ attendanceRecords }: AttendanceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Attendance History</CardTitle>
        <CardDescription>
          A log of all your check-in and check-out records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={attendanceRecords} />
      </CardContent>
    </Card>
  );
}
