// src/app/dashboard/organization/components/permissions-list.ts
import type { Permission } from '@/lib/data';

export const permissionsList: { id: Permission, label: string }[] = [
    { id: 'dashboard', label: 'View Dashboard' },
    { id: 'employees', label: 'Manage Employees' },
    { id: 'recruitment', label: 'Manage Recruitment' },
    { id: 'payroll', label: 'Manage Payroll' },
    { id: 'payment-methods', label: 'Manage Payment Methods' },
    { id: 'leave', label: 'Manage Leave' },
    { id: 'attendance', label: 'Manage Attendance' },
    { id: 'roster', label: 'Manage Roster' },
    { id: 'performance', label: 'Manage Performance' },
    { id: 'reporting', label: 'View Reporting' },
    { id: 'organization', label: 'Manage Organization' },
    { id: 'compliance', label: 'Access Compliance Advisor' },
    { id: 'settings', label: 'Manage Settings' },
];
