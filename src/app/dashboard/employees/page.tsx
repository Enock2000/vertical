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
import type { Employee, Department } from '@/lib/data';
import { AddEmployeeDialog } from './components/add-employee-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const departmentsRef = ref(db, 'departments');
    
    let employeesLoaded = false;
    let deptsLoaded = false;

    const checkLoading = () => {
        if (employeesLoaded && deptsLoaded) {
            setLoading(false);
        }
    };

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
      employeesLoaded = true;
      checkLoading();
    }, (error) => {
        console.error("Firebase read failed (employees): " + error.name);
        employeesLoaded = true;
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
        deptsLoaded = true;
        checkLoading();
    }, (error) => {
        console.error("Firebase read failed (departments): " + error.name);
        deptsLoaded = true;
        checkLoading();
    });


    return () => {
        employeesUnsubscribe();
        departmentsUnsubscribe();
    };
  }, []);

  const handleAction = () => {
    // The onValue listener will automatically update the state
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage your employees and their details.
          </CardDescription>
        </div>
        <AddEmployeeDialog departments={departments} onEmployeeAdded={handleAction}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-rap">
              Add Employee
            </span>
          </Button>
        </AddEmployeeDialog>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <DataTable columns={columns(departments, handleAction)} data={employees} />
        )}
      </CardContent>
    </Card>
  );
}
