// src/app/employee-portal/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/lib/data';
import { Loader2, Megaphone } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function AnnouncementsPage() {
    const { employee, companyId, loading: authLoading } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (companyId && employee) {
            const announcementsRef = ref(db, `companies/${companyId}/announcements`);
            const unsubscribe = onValue(announcementsRef, (snapshot) => {
                const allData: Record<string, Announcement> = snapshot.val();
                if (allData) {
                    const userAnnouncements = Object.values(allData).filter(ann => 
                        ann.audience === 'all' || 
                        (Array.isArray(ann.audience) && ann.audience.includes(employee.departmentId))
                    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setAnnouncements(userAnnouncements);
                } else {
                    setAnnouncements([]);
                }
                setLoadingData(false);
            }, (error) => {
                console.error("Firebase read failed (announcements):", error);
                setLoadingData(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [companyId, employee, authLoading]);

    if (authLoading || loadingData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                    All company and department-specific announcements.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {announcements.length > 0 ? (
                    <div className="space-y-6">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="border-b pb-6 last:border-b-0">
                                <h3 className="text-xl font-semibold">{ann.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Posted by {ann.authorName} on {format(new Date(ann.createdAt), 'MMMM d, yyyy')}
                                </p>
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {ann.content.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                        <Megaphone className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">There are no announcements for you at the moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
