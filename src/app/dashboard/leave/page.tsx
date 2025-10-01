
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { ResignationDataTable } from './components/resignation-data-table';
import { resignationColumns } from './components/resignation-columns';
import type { LeaveRequest, Employee, ResignationRequest } from '@/lib/data';
import { createNotification } from '@/lib/data';
import { RequestLeaveDialog } from './components/request-leave-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useSearchParams } from 'next/navigation';

export default function LeavePage() {
  const { companyId } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'requests';
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [resignationRequests, setResignationRequests] = useState<ResignationRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!companyId) return;

    const requestsRef = ref(db, `companies/${companyId}/leaveRequests`);
    const resignationsRef = ref(db, `companies/${companyId}/resignationRequests`);
    const employeesRef = ref(db, 'employees');
    let requestsLoaded = false, employeesLoaded = false, resignationsLoaded = false;

    const checkLoading = () => {
        if(requestsLoaded && employeesLoaded && resignationsLoaded) {
            setLoading(false);
        }
    }

    const requestsUnsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      const requestList = data ? Object.keys(data).map(key => ({
          ...data[key],
          id: key,
      })).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) : [];
      setLeaveRequests(requestList);
      requestsLoaded = true; checkLoading();
    });

     const resignationsUnsubscribe = onValue(resignationsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values<ResignationRequest>(data).sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()) : [];
      setResignationRequests(list);
      resignationsLoaded = true; checkLoading();
    });

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      const employeeList = data ? Object.values<Employee>(data).filter(e => e.companyId === companyId) : [];
      setEmployees(employeeList);
      employeesLoaded = true; checkLoading();
    });

    return () => {
      requestsUnsubscribe();
      employeesUnsubscribe();
      resignationsUnsubscribe();
    };
  }, [companyId]);

  const handleLeaveRequestAdded = () => {};

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request || !companyId) return;

    try {
        const requestRef = ref(db, `companies/${companyId}/leaveRequests/${id}`);
        await update(requestRef, { status });
        
        await createNotification(companyId, {
            userId: request.employeeId,
            title: `Leave Request ${status}`,
            message: `Your leave request for ${request.leaveType} has been ${status.toLowerCase()}.`,
            link: '/employee-portal/attendance',
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
  
   const handleResignationStatusUpdate = async (id: string, status: 'Approved' | 'Withdrawn') => {
    const request = resignationRequests.find(r => r.id === id);
    if (!request || !companyId) return;

    try {
        await update(ref(db, `companies/${companyId}/resignationRequests/${id}`), { status });
        
        if (status === 'Approved') {
            await update(ref(db, `employees/${request.employeeId}`), { 
                status: 'Inactive',
                terminationDate: request.resignationDate,
                terminationReason: `Resignation approved. Reason: ${request.reason}`
            });
        }
        
        await createNotification(companyId, {
            userId: request.employeeId,
            title: `Resignation Request ${status}`,
            message: `Your resignation request has been ${status.toLowerCase()}.`,
            link: '/employee-portal',
        });

        toast({
            title: `Request ${status}`,
            description: `The resignation request has been successfully ${status.toLowerCase()}.`
        })
    } catch (error) {
        console.error("Error updating resignation status: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update resignation request status."
        })
    }
  }


  return (
    <Tabs defaultValue={defaultTab}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Leave & Resignation Management</CardTitle>
            <CardDescription>
              Manage employee leave and resignation requests.
            </CardDescription>
          </div>
           <RequestLeaveDialog employees={employees} onLeaveRequestAdded={handleLeaveRequestAdded}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                Add Leave Request
              </span>
            </Button>
          </RequestLeaveDialog>
        </CardHeader>
        <CardContent>
           <TabsList className="mb-4">
              <TabsTrigger value="requests">Leave Requests</TabsTrigger>
              <TabsTrigger value="resignations">Resignations</TabsTrigger>
          </TabsList>
          {loading ? (
               <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          ) : (
            <>
              <TabsContent value="requests">
                  <DataTable columns={columns(handleStatusUpdate)} data={leaveRequests} />
              </TabsContent>
               <TabsContent value="resignations">
                  <ResignationDataTable columns={resignationColumns(handleResignationStatusUpdate)} data={resignationRequests} />
              </TabsContent>
            </>
          )}
        </CardContent>
      </Card>
    </Tabs>
  );
}
