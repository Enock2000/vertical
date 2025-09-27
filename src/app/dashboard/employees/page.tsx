
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
import { Employee } from '@/lib/data';
import { AddEmployeeDialog } from './components/add-employee-dialog';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    try {
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
        }
    } catch (error) {
        console.error("Could not parse employees from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('employees', JSON.stringify(employees));
        } catch (error) {
            console.error("Could not save employees to localStorage", error);
        }
    }
  }, [employees, isClient]);


  const addEmployee = (employee: Omit<Employee, 'id' | 'avatar'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: `${Date.now()}`,
      avatar: `https://avatar.vercel.sh/${employee.email}.png`,
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage your employees and their details.
          </CardDescription>
        </div>
        <AddEmployeeDialog onAddEmployee={addEmployee}>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-rap">
              Add Employee
            </span>
          </Button>
        </AddEmployeeDialog>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={employees} />
      </CardContent>
    </Card>
  );
}
