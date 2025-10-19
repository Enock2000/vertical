
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Download } from 'lucide-react';
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
import type { Employee, Department, Bank, Role, Branch } from '@/lib/data';
import { AddEmployeeDialog } from './components/add-employee-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { ImportEmployeesDialog } from './components/import-employees-dialog';

export default function EmployeesPage() {
  const { company, companyId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const employeesRef = ref(db, 'employees');
    const departmentsRef = ref(db, `companies/${companyId}/departments`);
    const branchesRef = ref(db, `companies/${companyId}/branches`);
    const banksRef = ref(db, `companies/${companyId}/banks`);
    const rolesRef = ref(db, `companies/${companyId}/roles`);
    
    let loadedCount = 0;
    const totalToLoad = 5;

    const checkLoading = () => {
        loadedCount++;
        if (loadedCount === totalToLoad) {
            setLoading(false);
        }
    };

    const employeesUnsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId);
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
      checkLoading();
    }, (error) => {
        console.error("Firebase read failed (employees): " + error.name);
        checkLoading();
    });
    
    const departmentsUnsubscribe = onValue(departmentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const deptList = Object.keys(data).map(key => ({
                ...data[key],
                id: key,
            }));
            setDepartments(deptList);
        } else {
            setDepartments([]);
        }
        checkLoading();
    }, (error) => {
        console.error("Firebase read failed (departments): " + error.name);
        checkLoading();
    });

     const branchesUnsubscribe = onValue(branchesRef, (snapshot) => {
        const data = snapshot.val();
        setBranches(data ? Object.values(data) : []);
        checkLoading();
    });

    const banksUnsubscribe = onValue(banksRef, (snapshot) => {
      const data = snapshot.val();
      const list: Bank[] = data ? Object.values(data) : [];
      setBanks(list);
      checkLoading();
    });

    const rolesUnsubscribe = onValue(rolesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setRoles(Object.values(data));
        } else {
            setRoles([]);
        }
        checkLoading();
    });

    return () => {
        employeesUnsubscribe();
        departmentsUnsubscribe();
        branchesUnsubscribe();
        banksUnsubscribe();
        rolesUnsubscribe();
    };
  }, [companyId]);

  const handleAction = () => {
    // The onValue listener will automatically update the state
  };

  const tableColumns = columns(departments, branches, banks, roles, handleAction);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage your employees and their details.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <ImportEmployeesDialog companyId={companyId!} companyName={company?.name || ''} onImportComplete={handleAction} />
            <AddEmployeeDialog departments={departments} branches={branches} banks={banks} onEmployeeAdded={handleAction}>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                Add Employee
                </span>
            </Button>
            </AddEmployeeDialog>
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
