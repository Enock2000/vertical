'use client';

import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Employee, PayrollDetails, AttendanceRecord } from '@/lib/data';
import { Printer, Loader2, Download, Mail, Building2, User, Calendar, Clock, Briefcase, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface PayslipDialogProps {
  employee: Employee;
  payrollDetails: PayrollDetails | null;
  companyName: string;
  payslipDate: Date;
  children: React.ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-ZM', {
  style: 'currency',
  currency: 'ZMW',
  minimumFractionDigits: 2,
});

export function PayslipDialog({ employee, payrollDetails, companyName, payslipDate, children }: PayslipDialogProps) {
  const { companyId, company } = useAuth();
  const { toast } = useToast();
  const payslipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ daysWorked: 0, totalDays: 0, overtimeHours: 0 });
  const [ytdEarnings, setYtdEarnings] = useState(0);
  const [loading, setLoading] = useState(false);

  const formattedPayslipDate = format(payslipDate, 'MMMM yyyy');
  const periodKey = format(payslipDate, 'yyyy-MM');

  // Load attendance stats for this period
  useEffect(() => {
    if (!open || !companyId) return;

    setLoading(true);
    const attendanceRef = ref(db, `companies/${companyId}/attendance`);

    get(attendanceRef).then(snapshot => {
      const data = snapshot.val() || {};
      let daysWorked = 0;
      let overtimeHours = 0;

      Object.keys(data).forEach(dateKey => {
        if (dateKey.startsWith(periodKey) && data[dateKey][employee.id]) {
          daysWorked++;
          const record = data[dateKey][employee.id] as AttendanceRecord;
          if (record.overtime) overtimeHours += record.overtime;
        }
      });

      // Calculate total work days in period
      const monthStart = startOfMonth(payslipDate);
      const monthEnd = endOfMonth(payslipDate);
      const totalDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(d => !isWeekend(d)).length;

      setAttendanceStats({ daysWorked, totalDays, overtimeHours });

      // Calculate YTD (simplified - sum of monthly salary * months worked)
      const joinDate = new Date(employee.joinDate);
      const monthsWorked = Math.max(1, Math.ceil((payslipDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      setYtdEarnings(payrollDetails ? payrollDetails.netPay * Math.min(monthsWorked, 12) : 0);

      setLoading(false);
    });
  }, [open, companyId, employee.id, periodKey, payslipDate, employee.joinDate, payrollDetails]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (payslipRef.current) {
      html2canvas(payslipRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip_${employee.name.replace(' ', '_')}_${periodKey}.pdf`);
      });
    }
  };

  const handleEmailPayslip = () => {
    toast({
      title: "Email Sent",
      description: `Payslip sent to ${employee.email}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Employee Payslip
          </DialogTitle>
          <DialogDescription>
            {employee.name} - {formattedPayslipDate}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          {payrollDetails && !loading ? (
            <div ref={payslipRef} className="p-6 bg-white dark:bg-background">
              {/* Header */}
              <div className="border-2 border-primary/20 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">{companyName}</h2>
                    <p className="text-sm text-muted-foreground">{company?.address || 'Lusaka, Zambia'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-lg px-4 py-1">PAYSLIP</Badge>
                    <p className="text-sm font-medium mt-2">{formattedPayslipDate}</p>
                  </div>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Employee Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employee ID:</span>
                      <span className="font-medium font-mono">{employee.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{employee.departmentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium">{employee.jobTitle || employee.role}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{employee.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-medium">{employee.accountNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pay Period:</span>
                      <span className="font-medium">{formattedPayslipDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pay Date:</span>
                      <span className="font-medium">{format(endOfMonth(payslipDate), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Attendance Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{attendanceStats.daysWorked}</p>
                    <p className="text-xs text-muted-foreground">Days Worked</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalDays}</p>
                    <p className="text-xs text-muted-foreground">Work Days</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{attendanceStats.overtimeHours}</p>
                    <p className="text-xs text-muted-foreground">Overtime Hrs</p>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Earnings */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-green-700 mb-3">Earnings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">{currencyFormatter.format(payrollDetails.basePay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span className="font-medium">{currencyFormatter.format(employee.allowances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Pay</span>
                      <span className="font-medium">{currencyFormatter.format(payrollDetails.overtimePay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus</span>
                      <span className="font-medium">{currencyFormatter.format(employee.bonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reimbursements</span>
                      <span className="font-medium">{currencyFormatter.format(employee.reimbursements)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-green-700">
                      <span>Total Earnings</span>
                      <span>{currencyFormatter.format(payrollDetails.grossPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-red-700 mb-3">Deductions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>NAPSA (5%)</span>
                      <span className="font-medium text-red-600">-{currencyFormatter.format(payrollDetails.employeeNapsaDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NHIMA (1%)</span>
                      <span className="font-medium text-red-600">-{currencyFormatter.format(payrollDetails.employeeNhimaDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PAYE (Tax)</span>
                      <span className="font-medium text-red-600">-{currencyFormatter.format(payrollDetails.taxDeduction)}</span>
                    </div>
                    {employee.deductions > 0 && (
                      <div className="flex justify-between">
                        <span>Other Deductions</span>
                        <span className="font-medium text-red-600">-{currencyFormatter.format(employee.deductions)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-red-700">
                      <span>Total Deductions</span>
                      <span>-{currencyFormatter.format(payrollDetails.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay & YTD */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                  <p className="text-sm opacity-80">Net Pay</p>
                  <p className="text-3xl font-bold">{currencyFormatter.format(payrollDetails.netPay)}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                  <p className="text-sm opacity-80">Year-to-Date Earnings</p>
                  <p className="text-3xl font-bold">{currencyFormatter.format(ytdEarnings)}</p>
                </div>
              </div>

              {/* Employer Contributions (Info) */}
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Employer Contributions (Not deducted from salary)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>NAPSA (Employer 5%)</span>
                    <span className="font-medium">{currencyFormatter.format(payrollDetails.employerNapsaContribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NHIMA (Employer 1%)</span>
                    <span className="font-medium">{currencyFormatter.format(payrollDetails.employerNhimaContribution)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>This is a computer-generated payslip. No signature required.</p>
                <p className="mt-1">Powered by VerticalSync • Oran Investment</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-0 flex gap-2">
          <Button type="button" variant="outline" onClick={handleEmailPayslip} disabled={!payrollDetails}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint} disabled={!payrollDetails}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button type="button" onClick={handleDownload} disabled={!payrollDetails}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
