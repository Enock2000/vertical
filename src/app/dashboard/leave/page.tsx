
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { LeaveRequest, Employee } from '@/lib/data';
import { RequestLeaveDialog } from './components/request-leave-dialog';
import { useToast } from '@/hooks/use-toast';

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
        const storedRequests = localStorage.getItem('leaveRequests');
        if (storedRequests) {
            setLeaveRequests(JSON.parse(storedRequests));
        }
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
        }
    } catch (error) {
        console.error("Could not parse data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
        } catch (error) {
            console.error("Could not save leave requests to localStorage", error);
        }
    }
  }, [leaveRequests, isClient]);


  const addLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: `${Date.now()}`,
      status: 'Pending',
    };
    setLeaveRequests(prev => [...prev, newRequest]);
  };

  const handleStatusUpdate = (id: string, status: 'Approved' | 'Rejected') => {
    const updatedRequests = leaveRequests.map(req => 
        req.id === id ? { ...req, status } : req
    );
    setLeaveRequests(updatedRequests);
    toast({
        title: `Request ${status}`,
        description: `The leave request has been successfully ${status.toLowerCase()}.`
    })
  }

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Leave Management</CardTitle>
          <CardDescription>
            Manage employee leave requests.
          </CardDescription>
        </div>
        <RequestLeaveDialog employees={employees} onAddLeaveRequest={addLeaveRequest}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Request Leave
            </span>
          </Button>
        </RequestLeaveDialog>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns(handleStatusUpdate)} data={leaveRequests} />
      </CardContent>
    </Card>
  );
}
