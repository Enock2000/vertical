
// src/app/dashboard/employees/components/view-employee-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee } from '@/lib/data';
import { format } from 'date-fns';

interface ViewEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
}

const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || <span className="text-muted-foreground/70">Not set</span>}</p>
    </div>
);

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' });

export function ViewEmployeeDialog({ children, employee }: ViewEmployeeDialogProps) {
  const nameInitial = employee.name.split(' ').map(n => n[0]).join('');

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
             <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="text-2xl">{nameInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="text-2xl">{employee.name}</DialogTitle>
                    <DialogDescription>{employee.role} - {employee.departmentName}</DialogDescription>
                </div>
            </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
                
                <section>
                    <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Email" value={employee.email} />
                        <DetailItem label="Phone" value={employee.phone} />
                        <DetailItem label="Gender" value={employee.gender} />
                        <DetailItem label="Date of Birth" value={employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'PPP') : null} />
                        <DetailItem label="Identification" value={`${employee.identificationType || ''} - ${employee.identificationNumber || ''}`} />
                        <DetailItem label="Location" value={employee.location} />
                    </div>
                </section>
                
                <Separator />
                
                <section>
                    <h3 className="text-lg font-semibold mb-2">Employment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Status" value={employee.status} />
                        <DetailItem label="Branch" value={employee.branchName} />
                        <DetailItem label="Join Date" value={format(new Date(employee.joinDate), 'PPP')} />
                        <DetailItem label="Leave Balance" value={`${employee.annualLeaveBalance} days`} />
                        <DetailItem label="Worker Type" value={employee.workerType} />
                        <DetailItem label="Contract Type" value={employee.contractType} />
                        <DetailItem label="Contract Start" value={employee.contractStartDate ? format(new Date(employee.contractStartDate), 'PPP') : null} />
                         <DetailItem label="Contract End" value={employee.contractEndDate ? format(new Date(employee.contractEndDate), 'PPP') : null} />
                    </div>
                </section>

                <Separator />
                
                <section>
                    <h3 className="text-lg font-semibold mb-2">Compensation</h3>
                     <div className="grid grid-cols-2 gap-4">
                         {employee.workerType === 'Salaried' && <DetailItem label="Salary" value={currencyFormatter.format(employee.salary)} />}
                         {employee.workerType === 'Hourly' && <DetailItem label="Hourly Rate" value={currencyFormatter.format(employee.hourlyRate)} />}
                         {employee.workerType === 'Hourly' && <DetailItem label="Hours Worked" value={employee.hoursWorked} />}
                         <DetailItem label="Allowances" value={currencyFormatter.format(employee.allowances)} />
                         <DetailItem label="Deductions" value={currencyFormatter.format(employee.deductions)} />
                         <DetailItem label="Overtime" value={currencyFormatter.format(employee.overtime)} />
                         <DetailItem label="Bonus" value={currencyFormatter.format(employee.bonus)} />
                         <DetailItem label="Reimbursements" value={currencyFormatter.format(employee.reimbursements)} />
                     </div>
                </section>

                 <Separator />

                 <section>
                    <h3 className="text-lg font-semibold mb-2">Bank Details</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Bank Name" value={employee.bankName} />
                        <DetailItem label="Account Number" value={employee.accountNumber} />
                        <DetailItem label="Branch Code" value={employee.branchCode} />
                     </div>
                </section>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
