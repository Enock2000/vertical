
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { createNotification } from '@/lib/data';
import { RequestLeaveDialog } from './components/request-leave-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';

export default function LeavePage() {
  const { companyId } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!companyId) return;

    const requestsRef = ref(db, `companies/${companyId}/leaveRequests`);
    const employeesRef = ref(db, 'employees');
    let requestsLoaded = false;
    let employeesLoaded = false;

    const checkLoading = () => {
        if(requestsLoaded && employeesLoaded) {
            setLoading(false);
        }
    }

    const requestsUnsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestList = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        })).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setLeaveRequests(requestList);
      } else {
        setLeaveRequests([]);
      }
      requestsLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Firebase read failed (leaveRequests): " + error.name);
      requestsLoaded = true;
      checkLoading();
    });

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId);
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
      employeesLoaded = true;
      checkLoading();
    }, (error) => {
        console.error("Firebase read failed (employees): " + error.name);
        employeesLoaded = true;
        checkLoading();
    });

    return () => {
      requestsUnsubscribe();
      employeesUnsubscribe();
    };
  }, [companyId]);

  const handleLeaveRequestAdded = () => {
    // onValue listener will handle updates
  };

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request || !companyId) return;

    try {
        const requestRef = ref(db, `companies/${companyId}/leaveRequests/${id}`);
        await update(requestRef, { status });
        
        // Notify the employee
        await createNotification(companyId, {
            userId: request.employeeId,
            title: `Leave Request ${status}`,
            message: `Your leave request for ${request.leaveType} has been ${status.toLowerCase()}.`,
            link: '/employee-portal',
        });

        toast({
            title: `Request ${status}`,
            description: `The leave request has been successfully ${status.toLowerCase()}.`
        })
    } catch (error) {
        console.error("Error updating leave status: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update leave request status."
        })
    }
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
        <RequestLeaveDialog employees={employees} onLeaveRequestAdded={handleLeaveRequestAdded}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-rap">
              Request Leave
            </span>
          </Button>
        </RequestLeaveDialog>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <DataTable columns={columns(handleStatusUpdate)} data={leaveRequests} />
        )}
      </CardContent>
    </Card>
  );
}
