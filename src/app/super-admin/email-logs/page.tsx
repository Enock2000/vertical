// src/app/super-admin/email-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { Loader2, ArrowLeft, Mail, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import Link from 'next/link';
import type { EmailLog } from '@/lib/email';

export default function EmailLogsPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'skipped'>('all');

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    useEffect(() => {
        const logsRef = ref(db, 'platformSettings/emailLogs');
        const unsubscribe = onValue(logsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const logsList: EmailLog[] = Object.values(data);
                // Sort by createdAt descending
                logsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setLogs(logsList);
            } else {
                setLogs([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!employee || employee.role !== 'Super Admin') return null;

    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.status === filter);

    const getStatusIcon = (status: EmailLog['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'skipped':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: EmailLog['status']) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-500">Success</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'skipped':
                return <Badge variant="secondary">Skipped</Badge>;
        }
    };

    const stats = {
        total: logs.length,
        success: logs.filter(l => l.status === 'success').length,
        failed: logs.filter(l => l.status === 'failed').length,
        skipped: logs.filter(l => l.status === 'skipped').length,
    };

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Logo />
                    </Link>
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => router.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Email Logs
                                    </CardTitle>
                                    <CardDescription>
                                        Track all email sending attempts and their status
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <p className="text-sm text-muted-foreground">Total Emails</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-green-500">{stats.success}</div>
                                    <p className="text-sm text-muted-foreground">Successful</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                                    <p className="text-sm text-muted-foreground">Failed</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-yellow-500">{stats.skipped}</div>
                                    <p className="text-sm text-muted-foreground">Skipped</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filter */}
                        <div className="flex justify-between items-center mb-4">
                            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Emails</SelectItem>
                                    <SelectItem value="success">Success Only</SelectItem>
                                    <SelectItem value="failed">Failed Only</SelectItem>
                                    <SelectItem value="skipped">Skipped Only</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredLogs.length} of {logs.length} logs
                            </p>
                        </div>

                        {/* Table */}
                        {filteredLogs.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Template</TableHead>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Error</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                                            <TableCell className="font-mono text-sm">{log.templateName}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{log.recipientName}</p>
                                                    <p className="text-xs text-muted-foreground">{log.recipientEmail}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-red-500 text-sm">
                                                {log.error || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No email logs yet.</p>
                                <p className="text-sm">Email attempts will appear here once triggered.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
