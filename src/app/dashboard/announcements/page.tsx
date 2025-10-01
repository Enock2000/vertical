// src/app/dashboard/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import type { Announcement, Department } from '@/lib/data';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { AddAnnouncementDialog } from './components/add-announcement-dialog';

export default function AnnouncementsPage() {
    const { companyId } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        let announcementsLoaded = false;
        let deptsLoaded = false;

        const checkLoading = () => {
            if (announcementsLoaded && deptsLoaded) {
                setLoading(false);
            }
        };

        const announcementsRef = ref(db, `companies/${companyId}/announcements`);
        const announcementsUnsubscribe = onValue(announcementsRef, (snapshot) => {
            const data = snapshot.val();
            const list: Announcement[] = data ? Object.values(data) : [];
            list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAnnouncements(list);
            announcementsLoaded = true;
            checkLoading();
        });

        const departmentsRef = ref(db, `companies/${companyId}/departments`);
        const departmentsUnsubscribe = onValue(departmentsRef, (snapshot) => {
            const data = snapshot.val();
            setDepartments(data ? Object.values(data) : []);
            deptsLoaded = true;
            checkLoading();
        });

        return () => {
            announcementsUnsubscribe();
            departmentsUnsubscribe();
        };

    }, [companyId]);

    const handleDelete = async (announcementId: string) => {
        if (!companyId) return;
        await remove(ref(db, `companies/${companyId}/announcements/${announcementId}`));
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Announcements</CardTitle>
                    <CardDescription>Create and manage company-wide or department-specific announcements.</CardDescription>
                </div>
                <AddAnnouncementDialog departments={departments}>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                            New Announcement
                        </span>
                    </Button>
                </AddAnnouncementDialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <DataTable columns={columns(departments, handleDelete)} data={announcements} />
                )}
            </CardContent>
        </Card>
    );
}
