// src/app/dashboard/payment-methods/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { Employee } from '@/lib/data';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function PaymentMethodsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeeList = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }));
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Firebase read failed (employees): " + error.name);
        setLoading(false);
    });

    return () => {
        employeesUnsubscribe();
    };
  }, []);

  const handleAction = () => {
    // The onValue listener will automatically update the state
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage employee bank details for payroll processing.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <DataTable columns={columns(handleAction)} data={employees} />
        )}
      </CardContent>
    </Card>
  );
}
