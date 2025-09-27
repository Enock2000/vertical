// src/app/dashboard/organization/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RolesTab } from './components/roles-tab';
import { DepartmentsTab } from './components/departments-tab';
import type { Role, Department } from '@/lib/data';

export default function OrganizationPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const rolesRef = ref(db, 'roles');
        const departmentsRef = ref(db, 'departments');
        
        let rolesLoaded = false;
        let deptsLoaded = false;

        const checkLoading = () => {
            if (rolesLoaded && deptsLoaded) {
                setLoading(false);
            }
        };

        const rolesUnsubscribe = onValue(rolesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roleList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setRoles(roleList);
            } else {
                setRoles([]);
            }
            rolesLoaded = true;
            checkLoading();
        }, (error) => {
            console.error("Firebase read failed (roles): " + error.name);
            rolesLoaded = true;
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
            rolesUnsubscribe();
            departmentsUnsubscribe();
        };
    }, []);

    const handleRoleAction = () => {
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
            </TabsList>
            <TabsContent value="roles">
                <RolesTab 
                    roles={roles} 
                    departments={departments} 
                    onRoleAdded={handleRoleAction}
                    onRoleUpdated={handleRoleAction}
                    onRoleDeleted={handleRoleAction}
                />
            </TabsContent>
            <TabsContent value="departments">
                <DepartmentsTab departments={departments} />
            </TabsContent>
        </Tabs>
    );
}
