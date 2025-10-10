

// src/app/dashboard/organization/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RolesTab } from './components/roles-tab';
import { DepartmentsTab } from './components/departments-tab';
import type { Role, Department, Shift, Branch } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { ShiftsTab } from './components/shifts-tab';
import { BranchesTab } from './components/branches-tab';

export default function OrganizationPage() {
    const { companyId } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const rolesRef = ref(db, `companies/${companyId}/roles`);
        const departmentsRef = ref(db, `companies/${companyId}/departments`);
        const shiftsRef = ref(db, `companies/${companyId}/shifts`);
        const branchesRef = ref(db, `companies/${companyId}/branches`);
        
        let loadedCount = 0;
        const totalToLoad = 4;

        const checkLoading = () => {
            loadedCount++;
            if (loadedCount === totalToLoad) {
                setLoading(false);
            }
        };

        const onValueCallback = (setter: React.Dispatch<any>) => (snapshot: any) => {
            const data = snapshot.val();
             const list = data ? Object.keys(data).map(key => ({
                ...data[key],
                id: key,
            })) : [];
            setter(list);
            checkLoading();
        }

        const rolesUnsubscribe = onValue(rolesRef, onValueCallback(setRoles), (error) => { console.error(error); checkLoading() });
        const departmentsUnsubscribe = onValue(departmentsRef, onValueCallback(setDepartments), (error) => { console.error(error); checkLoading() });
        const shiftsUnsubscribe = onValue(shiftsRef, onValueCallback(setShifts), (error) => { console.error(error); checkLoading() });
        const branchesUnsubscribe = onValue(branchesRef, onValueCallback(setBranches), (error) => { console.error(error); checkLoading() });

        return () => {
            rolesUnsubscribe();
            departmentsUnsubscribe();
            shiftsUnsubscribe();
            branchesUnsubscribe();
        };
    }, [companyId]);

    const handleAction = () => {
        // The onValue listeners will handle UI updates automatically.
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="roles">
            <TabsList className="mb-4">
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
                <TabsTrigger value="shifts">Shifts</TabsTrigger>
            </TabsList>
            <TabsContent value="roles">
                <RolesTab 
                    roles={roles} 
                    departments={departments} 
                    onRoleAdded={handleAction}
                    onRoleUpdated={handleAction}
                    onRoleDeleted={handleAction}
                />
            </TabsContent>
            <TabsContent value="departments">
                <DepartmentsTab departments={departments} onAction={handleAction} />
            </TabsContent>
            <TabsContent value="branches">
                <BranchesTab branches={branches} onAction={handleAction} />
            </TabsContent>
             <TabsContent value="shifts">
                <ShiftsTab shifts={shifts} onAction={handleAction} />
            </TabsContent>
        </Tabs>
    );
}
