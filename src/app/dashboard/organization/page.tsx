

// src/app/dashboard/organization/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RolesTab } from './components/roles-tab';
import { DepartmentsTab } from './components/departments-tab';
import type { Role, Department, Shift } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { ShiftsTab } from './components/shifts-tab';

export default function OrganizationPage() {
    const { companyId } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const rolesRef = ref(db, `companies/${companyId}/roles`);
        const departmentsRef = ref(db, `companies/${companyId}/departments`);
        const shiftsRef = ref(db, `companies/${companyId}/shifts`);
        
        let rolesLoaded = false;
        let deptsLoaded = false;
        let shiftsLoaded = false;

        const checkLoading = () => {
            if (rolesLoaded && deptsLoaded && shiftsLoaded) {
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
        }

        const rolesUnsubscribe = onValue(rolesRef, (snapshot) => {
            onValueCallback(setRoles)(snapshot);
            rolesLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (roles): " + error.name);
            rolesLoaded = true;
            checkLoading();
        });

        const departmentsUnsubscribe = onValue(departmentsRef, (snapshot) => {
            onValueCallback(setDepartments)(snapshot);
            deptsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (departments): " + error.name);
            deptsLoaded = true;
            checkLoading();
        });
        
        const shiftsUnsubscribe = onValue(shiftsRef, (snapshot) => {
            onValueCallback(setShifts)(snapshot);
            shiftsLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (shifts): " + error.name);
            shiftsLoaded = true;
            checkLoading();
        });

        return () => {
            rolesUnsubscribe();
            departmentsUnsubscribe();
            shiftsUnsubscribe();
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
             <TabsContent value="shifts">
                <ShiftsTab shifts={shifts} onAction={handleAction} />
            </TabsContent>
        </Tabs>
    );
}
