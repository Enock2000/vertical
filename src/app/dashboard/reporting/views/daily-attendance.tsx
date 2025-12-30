// src/app/dashboard/reporting/views/daily-attendance.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    CheckCircle,
    Clock,
    XCircle,
    Coffee,
    AlertTriangle,
    Search,
    RefreshCw,
    Download,
    Timer
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Employee, AttendanceRecord } from '@/lib/data';
import { downloadAttendanceSummary } from '@/lib/export-utils';

interface DailyAttendanceDashboardProps {
    employees: Employee[];
    todayAttendance: Record<string, AttendanceRecord>;
    date?: Date;
    onRefresh?: () => void;
}

export function DailyAttendanceDashboard({
    employees,
    todayAttendance,
    date = new Date(),
    onRefresh
}: DailyAttendanceDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30s
        return () => clearInterval(timer);
    }, []);

    // Calculate statistics
    const stats = useMemo(() => {
        const records = Object.values(todayAttendance);
        const activeEmployees = employees.filter(e => e.status === 'Active');
        const totalEmployees = activeEmployees.length;
        const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const late = records.filter(r => r.status === 'Late').length;
        const onBreak = records.filter(r => r.status === 'On Break').length;
        const clockedOut = records.filter(r => r.checkOutTime !== null).length;
        const absent = totalEmployees - records.length;
        const missingPunch = records.filter(r => !r.checkOutTime && r.status !== 'On Break').length;

        // Calculate total overtime
        const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

        return {
            totalEmployees,
            present,
            late,
            onBreak,
            clockedOut,
            absent,
            missingPunch,
            attendanceRate: totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0,
            totalOvertimeHours: Math.round(totalOvertimeMinutes / 60 * 10) / 10
        };
    }, [employees, todayAttendance]);

    // Merge employees with attendance records
    const attendanceList = useMemo(() => {
        const activeEmployees = employees.filter(e => e.status === 'Active' && e.id !== e.companyId);
        return activeEmployees
            .map(emp => ({
                employee: emp,
                record: todayAttendance[emp.id] || null
            }))
            .filter(item =>
                item.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.employee.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Sort: On Break first, then Present, then Late, then Absent
                const statusOrder = { 'On Break': 0, 'Present': 1, 'Late': 2, null: 3 };
                const aOrder = a.record?.status === 'On Break' ? 0 : a.record?.status === 'Present' ? 1 : a.record?.status === 'Late' ? 2 : 3;
                const bOrder = b.record?.status === 'On Break' ? 0 : b.record?.status === 'Present' ? 1 : b.record?.status === 'Late' ? 2 : 3;
                return aOrder - bOrder;
            });
    }, [employees, todayAttendance, searchQuery]);

    const getWorkDuration = (record: AttendanceRecord | null) => {
        if (!record?.checkInTime) return '-';
        const checkIn = parseISO(record.checkInTime);
        const endTime = record.checkOutTime ? parseISO(record.checkOutTime) : currentTime;
        const minutes = differenceInMinutes(endTime, checkIn) - (record.breakDuration || 0);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getStatusBadge = (record: AttendanceRecord | null) => {
        if (!record) {
            return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Absent</Badge>;
        }
        switch (record.status) {
            case 'On Break':
                return <Badge className="gap-1 bg-orange-100 text-orange-700"><Coffee className="h-3 w-3" />On Break</Badge>;
            case 'Late':
                return <Badge variant="outline" className="gap-1 text-red-600 border-red-200"><Clock className="h-3 w-3" />Late ({record.lateMinutes}m)</Badge>;
            case 'Present':
                return <Badge variant="secondary" className="gap-1 text-green-600"><CheckCircle className="h-3 w-3" />Present</Badge>;
            case 'Auto Clock-out':
                return <Badge variant="outline" className="gap-1"><Timer className="h-3 w-3" />Auto Out</Badge>;
            default:
                return <Badge variant="outline">{record.status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Daily Attendance</h2>
                    <p className="text-muted-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const allAttendance: Record<string, Record<string, AttendanceRecord>> = {
                                [format(date, 'yyyy-MM-dd')]: todayAttendance
                            };
                            downloadAttendanceSummary(employees, allAttendance);
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.present}</p>
                                <p className="text-xs text-muted-foreground">Present</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.late}</p>
                                <p className="text-xs text-muted-foreground">Late</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.absent}</p>
                                <p className="text-xs text-muted-foreground">Absent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Coffee className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.onBreak}</p>
                                <p className="text-xs text-muted-foreground">On Break</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.missingPunch}</p>
                                <p className="text-xs text-muted-foreground">No Clock-out</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Rate */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Attendance Rate</span>
                        <span className="text-sm font-bold">{stats.attendanceRate}%</span>
                    </div>
                    <Progress value={stats.attendanceRate} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{stats.present} present of {stats.totalEmployees} employees</span>
                        <span>Overtime: {stats.totalOvertimeHours}h</span>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Employee Attendance</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Clock In</TableHead>
                                <TableHead>Clock Out</TableHead>
                                <TableHead>Work Time</TableHead>
                                <TableHead>Break</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceList.map(({ employee, record }) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={employee.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{employee.name}</p>
                                                <p className="text-xs text-muted-foreground">{employee.role}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{employee.departmentName || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(record)}</TableCell>
                                    <TableCell>
                                        {record?.checkInTime ? format(parseISO(record.checkInTime), 'hh:mm a') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {record?.checkOutTime ? format(parseISO(record.checkOutTime), 'hh:mm a') : '-'}
                                    </TableCell>
                                    <TableCell>{getWorkDuration(record)}</TableCell>
                                    <TableCell>
                                        {record?.breakDuration ? `${record.breakDuration}m` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
