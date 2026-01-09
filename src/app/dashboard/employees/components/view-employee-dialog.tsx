// src/app/dashboard/employees/components/view-employee-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Briefcase,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Package,
  TrendingUp,
  Award,
  Shield,
  CalendarDays,
  Plane,
  UserCheck,
  Fingerprint,
  Cake,
  Users,
  Loader2,
} from 'lucide-react';
import type { Employee, Asset, LeaveRequest, AttendanceRecord, PayrollConfig, EmployeeDocument } from '@/lib/data';
import { calculatePayroll } from '@/lib/data';
import { format, differenceInYears, differenceInMonths, differenceInDays, parseISO, isThisMonth, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, onValue, get, push, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { uploadToB2 } from '@/lib/backblaze';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ViewEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

const DetailItem = ({ icon: Icon, label, value, className = '' }: { icon?: React.ElementType, label: string, value: string | number | undefined | null, className?: string }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value || <span className="text-muted-foreground/70 italic">Not set</span>}</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subValue, color = 'primary' }: { icon: React.ElementType, label: string, value: string | number, subValue?: string, color?: string }) => (
  <div className={`p-4 rounded-lg bg-${color}-50 dark:bg-${color}-950 border border-${color}-100 dark:border-${color}-900`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-lg">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  </div>
);

const currencyFormatter = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', minimumFractionDigits: 0 });

export function ViewEmployeeDialog({ children, employee }: ViewEmployeeDialogProps) {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<EmployeeDocument['type']>('Other');

  const nameInitial = employee.name.split(' ').map(n => n[0]).join('');

  // Load related data when dialog opens
  useEffect(() => {
    if (!open || !companyId) return;

    setLoading(true);
    let loadCount = 0;
    const checkLoading = () => { if (++loadCount >= 5) setLoading(false); };

    // Load documents
    const docsRef = ref(db, `employees/${employee.id}/documents`);
    get(docsRef).then(snapshot => {
      const data = snapshot.val();
      if (data) {
        setDocuments(Object.values(data));
      } else {
        setDocuments([]);
      }
      checkLoading();
    });

    // Load assigned assets
    const assetsRef = ref(db, `companies/${companyId}/assets`);
    get(assetsRef).then(snapshot => {
      const data = snapshot.val();
      if (data) {
        const employeeAssets = Object.keys(data)
          .map(k => ({ ...data[k], id: k }))
          .filter((a: Asset) => a.assignedTo === employee.id);
        setAssets(employeeAssets);
      }
      checkLoading();
    });

    // Load leave requests
    const leaveRef = ref(db, `companies/${companyId}/leaveRequests`);
    get(leaveRef).then(snapshot => {
      const data = snapshot.val();
      if (data) {
        const empLeave = Object.keys(data)
          .map(k => ({ ...data[k], id: k }))
          .filter((l: LeaveRequest) => l.employeeId === employee.id);
        setLeaveRequests(empLeave);
      }
      checkLoading();
    });

    // Load this month's attendance
    const today = new Date();
    const monthKey = format(today, 'yyyy-MM');
    const attendanceRef = ref(db, `companies/${companyId}/attendance`);
    get(attendanceRef).then(snapshot => {
      const data = snapshot.val() || {};
      const monthAttendance: Record<string, AttendanceRecord> = {};
      Object.keys(data).forEach(dateKey => {
        if (dateKey.startsWith(monthKey) && data[dateKey][employee.id]) {
          monthAttendance[dateKey] = data[dateKey][employee.id];
        }
      });
      setAttendanceData(monthAttendance);
      checkLoading();
    });

    // Load payroll config
    const configRef = ref(db, `companies/${companyId}/payrollConfig`);
    get(configRef).then(snapshot => {
      setPayrollConfig(snapshot.val());
      checkLoading();
    });
  }, [open, companyId, employee.id]);

  // Calculate tenure
  const tenure = useMemo(() => {
    const joinDate = new Date(employee.joinDate);
    const now = new Date();
    const years = differenceInYears(now, joinDate);
    const months = differenceInMonths(now, joinDate) % 12;
    const days = differenceInDays(now, joinDate) % 30;

    if (years > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
    return `${days} day${days !== 1 ? 's' : ''}`;
  }, [employee.joinDate]);

  // Calculate age
  const age = useMemo(() => {
    if (!employee.dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(employee.dateOfBirth));
  }, [employee.dateOfBirth]);

  // Calculate payroll details
  const payrollDetails = useMemo(() => {
    if (!payrollConfig) return null;
    return calculatePayroll(employee, payrollConfig);
  }, [employee, payrollConfig]);

  // Calculate attendance stats
  const attendanceStats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const workDays = eachDayOfInterval({ start: monthStart, end: today })
      .filter(d => !isWeekend(d)).length;
    const daysPresent = Object.keys(attendanceData).length;
    const rate = workDays > 0 ? Math.round((daysPresent / workDays) * 100) : 0;
    return { workDays, daysPresent, rate };
  }, [attendanceData]);

  // Leave stats
  const leaveStats = useMemo(() => {
    const approved = leaveRequests.filter(l => l.status === 'Approved').length;
    const pending = leaveRequests.filter(l => l.status === 'Pending').length;
    const rejected = leaveRequests.filter(l => l.status === 'Rejected').length;
    return { approved, pending, rejected, total: leaveRequests.length };
  }, [leaveRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'On Leave': case 'Sick': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Suspended': case 'Inactive': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'Offboarded': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 p-6 text-white">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/30 shadow-lg">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="text-2xl bg-white/20 text-white">{nameInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <Badge className={`${getStatusColor(employee.status)} border-0`}>
                  {employee.status}
                </Badge>
                {employee.role === 'Admin' && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Shield className="h-3 w-3 mr-1" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-purple-100 mt-1">{employee.jobTitle || employee.role} • {employee.departmentName}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-purple-200">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {employee.email}</span>
                {employee.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {employee.phone}</span>}
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm text-purple-200">Employee ID</p>
              <p className="font-mono text-sm">{employee.id.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-purple-200 mt-2">Tenure</p>
              <p className="font-semibold">{tenure}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1">
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <TrendingUp className="h-4 w-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="personal" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <User className="h-4 w-4 mr-2" /> Personal
              </TabsTrigger>
              <TabsTrigger value="employment" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Briefcase className="h-4 w-4 mr-2" /> Employment
              </TabsTrigger>
              <TabsTrigger value="compensation" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <DollarSign className="h-4 w-4 mr-2" /> Compensation
              </TabsTrigger>
              <TabsTrigger value="assets" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Package className="h-4 w-4 mr-2" /> Assets
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <FileText className="h-4 w-4 mr-2" /> Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[50vh] px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net Pay</p>
                          <p className="font-bold text-lg">{payrollDetails ? currencyFormatter.format(payrollDetails.netPay) : '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Plane className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Leave Balance</p>
                          <p className="font-bold text-lg">{employee.annualLeaveBalance} days</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Attendance Rate</p>
                          <p className="font-bold text-lg">{attendanceStats.rate}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                          <Package className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Assigned Assets</p>
                          <p className="font-bold text-lg">{assets.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> This Month's Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{attendanceStats.daysPresent} of {attendanceStats.workDays} work days</span>
                          <span className="font-medium">{attendanceStats.rate}%</span>
                        </div>
                        <Progress value={attendanceStats.rate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Leave Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> Leave Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{leaveStats.approved}</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-600">{leaveStats.pending}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{leaveStats.rejected}</p>
                          <p className="text-xs text-muted-foreground">Rejected</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{employee.annualLeaveBalance}</p>
                          <p className="text-xs text-muted-foreground">Balance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personal Tab */}
                <TabsContent value="personal" className="mt-0 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DetailItem icon={Mail} label="Email Address" value={employee.email} />
                        <DetailItem icon={Phone} label="Phone Number" value={employee.phone} />
                        <DetailItem icon={MapPin} label="Location" value={employee.location} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DetailItem icon={User} label="Gender" value={employee.gender} />
                        <DetailItem icon={Cake} label="Date of Birth" value={employee.dateOfBirth ? `${format(new Date(employee.dateOfBirth), 'PPP')} (${age} years old)` : null} />
                        <DetailItem icon={Fingerprint} label="Identification" value={employee.identificationType && employee.identificationNumber ? `${employee.identificationType}: ${employee.identificationNumber}` : null} />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <DetailItem icon={Building2} label="Bank Name" value={employee.bankName} />
                        <DetailItem icon={CreditCard} label="Account Number" value={employee.accountNumber} />
                        <DetailItem icon={FileText} label="Branch Code" value={employee.branchCode} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Employment Tab */}
                <TabsContent value="employment" className="mt-0 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Position Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DetailItem icon={Briefcase} label="Job Title" value={employee.jobTitle || employee.role} />
                        <DetailItem icon={Users} label="Department" value={employee.departmentName} />
                        <DetailItem icon={Building2} label="Branch" value={employee.branchName} />
                        <DetailItem icon={Award} label="Worker Type" value={employee.workerType} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Contract Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DetailItem icon={FileText} label="Contract Type" value={employee.contractType} />
                        <DetailItem icon={Calendar} label="Join Date" value={format(new Date(employee.joinDate), 'PPP')} />
                        <DetailItem icon={Calendar} label="Contract Start" value={employee.contractStartDate ? format(new Date(employee.contractStartDate), 'PPP') : null} />
                        <DetailItem icon={Calendar} label="Contract End" value={employee.contractEndDate ? format(new Date(employee.contractEndDate), 'PPP') : 'Ongoing'} />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Employment Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Total Tenure</p>
                          <p className="text-xl font-bold">{tenure}</p>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Current Status</p>
                          <Badge className={`${getStatusColor(employee.status)} mt-1`}>{employee.status}</Badge>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Leave Balance</p>
                          <p className="text-xl font-bold">{employee.annualLeaveBalance} <span className="text-sm font-normal">days</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Compensation Tab */}
                <TabsContent value="compensation" className="mt-0 space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Gross Pay</p>
                        <p className="text-2xl font-bold text-green-700">{payrollDetails ? currencyFormatter.format(payrollDetails.grossPay) : '-'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-950 border-red-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Total Deductions</p>
                        <p className="text-2xl font-bold text-red-700">{payrollDetails ? currencyFormatter.format(payrollDetails.totalDeductions) : '-'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">Net Pay</p>
                        <p className="text-2xl font-bold text-blue-700">{payrollDetails ? currencyFormatter.format(payrollDetails.netPay) : '-'}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {employee.workerType === 'Salaried' && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Salary</span>
                            <span className="font-medium">{currencyFormatter.format(employee.salary)}</span>
                          </div>
                        )}
                        {employee.workerType === 'Hourly' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hourly Rate</span>
                              <span className="font-medium">{currencyFormatter.format(employee.hourlyRate)}/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hours Worked</span>
                              <span className="font-medium">{employee.hoursWorked} hrs</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Allowances</span>
                          <span className="font-medium">{currencyFormatter.format(employee.allowances)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Overtime</span>
                          <span className="font-medium">{currencyFormatter.format(employee.overtime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonus</span>
                          <span className="font-medium">{currencyFormatter.format(employee.bonus)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reimbursements</span>
                          <span className="font-medium">{currencyFormatter.format(employee.reimbursements)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {payrollDetails && (
                          <>
                            <div className="flex justify-between text-red-600">
                              <span>NAPSA ({payrollConfig?.employeeNapsaRate || 5}%)</span>
                              <span className="font-medium">-{currencyFormatter.format(payrollDetails.employeeNapsaDeduction)}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>NHIMA ({payrollConfig?.employeeNhimaRate || 1}%)</span>
                              <span className="font-medium">-{currencyFormatter.format(payrollDetails.employeeNhimaDeduction)}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>PAYE ({payrollConfig?.taxRate || 25}%)</span>
                              <span className="font-medium">-{currencyFormatter.format(payrollDetails.taxDeduction)}</span>
                            </div>
                            {employee.deductions > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Other Deductions</span>
                                <span className="font-medium">-{currencyFormatter.format(employee.deductions)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Assets Tab */}
                <TabsContent value="assets" className="mt-0 space-y-4">
                  {assets.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {assets.map(asset => (
                        <Card key={asset.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Package className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{asset.name}</p>
                                <p className="text-sm text-muted-foreground">{asset.category}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{asset.condition}</Badge>
                                  {asset.serialNumber && (
                                    <span className="text-xs text-muted-foreground">SN: {asset.serialNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mb-3 opacity-50" />
                      <p className="font-medium">No Assets Assigned</p>
                      <p className="text-sm">This employee has no company assets assigned.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Upload New Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as EmployeeDocument['type'])}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Document Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ID Copy">ID Copy</SelectItem>
                            <SelectItem value="Certificate">Certificate</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={isUploadingDoc}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !companyId) return;
                            setIsUploadingDoc(true);
                            try {
                              const path = `documents/${companyId}/${employee.id}/${selectedDocType}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                              const result = await uploadToB2(file, path);
                              if (!result.success || !result.url) throw new Error(result.error || 'Upload failed');

                              const docId = push(ref(db, `employees/${employee.id}/documents`)).key!;
                              const newDoc: EmployeeDocument = {
                                id: docId,
                                name: file.name,
                                type: selectedDocType,
                                url: result.url,
                                uploadedAt: new Date().toISOString(),
                              };
                              await update(ref(db, `employees/${employee.id}/documents/${docId}`), newDoc);
                              setDocuments(prev => [...prev, newDoc]);
                              toast({ title: 'Document uploaded!' });
                            } catch (error) {
                              console.error('Doc upload error:', error);
                              toast({ variant: 'destructive', title: 'Upload Failed' });
                            } finally {
                              setIsUploadingDoc(false);
                              e.target.value = '';
                            }
                          }}
                        />
                        {isUploadingDoc && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </CardContent>
                  </Card>

                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <Card key={doc.id}>
                          <CardContent className="pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.type} • {format(new Date(doc.uploadedAt), 'PPP')}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-3 opacity-50" />
                      <p className="font-medium">No Documents</p>
                      <p className="text-sm">Upload employee documents above.</p>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
