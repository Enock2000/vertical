
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Loader2, Users, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  // Filter employees by status
  const activeEmployees = useMemo(
    () => allEmployees.filter(e => e.status !== 'Offboarded'),
    [allEmployees]
  );

  const offboardedEmployees = useMemo(
    () => allEmployees.filter(e => e.status === 'Offboarded'),
    [allEmployees]
  );

  // Prepare filter options for DataTable
  const departmentOptions = useMemo(
    () => departments.map(d => ({ value: d.id, label: d.name })),
    [departments]
  );

  const branchOptions = useMemo(
    () => branches.map(b => ({ value: b.id || b.name, label: b.name })),
    [branches]
  );

  const roleOptions = useMemo(() => {
    // Get unique roles from employees
    const uniqueRoles = new Set<string>();
    allEmployees.forEach(e => {
      if (e.role) uniqueRoles.add(e.role);
      if (e.jobTitle) uniqueRoles.add(e.jobTitle);
    });
    return Array.from(uniqueRoles).map(r => ({ value: r, label: r }));
  }, [allEmployees]);

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
        // Filter by company and exclude Admin role (company owner/admin should not appear in employee list)
        const employeeList = Object.values<Employee>(data).filter(e => e.companyId === companyId && e.role !== 'Admin');
        setAllEmployees(employeeList);
      } else {
        setAllEmployees([]);
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-2">
                <Users className="h-4 w-4" />
                Active
                <Badge variant="secondary" className="ml-1">{activeEmployees.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offboarded" className="gap-2">
                <UserX className="h-4 w-4" />
                Offboarded
                <Badge variant="outline" className="ml-1">{offboardedEmployees.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <DataTable
                columns={tableColumns}
                data={activeEmployees}
                departments={departmentOptions}
                branches={branchOptions}
                roles={roleOptions}
              />
            </TabsContent>
            <TabsContent value="offboarded">
              {offboardedEmployees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No offboarded employees yet.</p>
                </div>
              ) : (
                <DataTable
                  columns={tableColumns}
                  data={offboardedEmployees}
                  departments={departmentOptions}
                  branches={branchOptions}
                  roles={roleOptions}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

