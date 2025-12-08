
// src/app/dashboard/payment-methods/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { Employee, Bank } from '@/lib/data';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';

export default function PaymentMethodsPage() {
  const { companyId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const employeesRef = ref(db, 'employees');
    const banksRef = ref(db, `companies/${companyId}/banks`);

    let employeesLoaded = false;
    let banksLoaded = false;

    const checkLoading = () => {
      if (employeesLoaded && banksLoaded) {
        setLoading(false);
      }
    };

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Exclude Admin role (company owner should not appear in employee list)
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.role !== 'Admin');
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

    const banksUnsubscribe = onValue(banksRef, (snapshot) => {
      const data = snapshot.val();
      const list: Bank[] = data ? Object.values(data) : [];
      setBanks(list);
      banksLoaded = true;
      checkLoading();
    });

    return () => {
      employeesUnsubscribe();
      banksUnsubscribe();
    };
  }, [companyId]);

  const handleAction = () => {
    // The onValue listener will automatically update the state
  };

  const tableColumns = columns(banks, handleAction);

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
          <DataTable columns={tableColumns} data={employees} />
        )}
      </CardContent>
    </Card>
  );
}
