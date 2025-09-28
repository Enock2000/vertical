'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Department, Bank } from '@/lib/data';
import { Loader2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.date().optional(),
  identificationType: z.enum(['ID Number', 'Passport', 'License']).optional(),
  identificationNumber: z.string().optional(),
  role: z.string().min(2, 'Role must be at least 2 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'On Leave', 'Sick']),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  workerType: z.enum(['Salaried', 'Hourly', 'Contractor']),
  salary: z.coerce.number().min(0, 'Salary must be a positive number.').optional(),
  hourlyRate: z.coerce.number().min(0, 'Hourly rate must be a positive number.').optional(),
  hoursWorked: z.coerce.number().min(0, 'Hours worked must be a positive number.').optional(),
  allowances: z.coerce.number().min(0, 'Allowances cannot be negative.'),
  deductions: z.coerce.number().min(0, 'Deductions cannot be negative.'),
  overtime: z.coerce.number().min(0, 'Overtime cannot be negative.'),
  bonus: z.coerce.number().min(0, 'Bonus cannot be negative.'),
  reimbursements: z.coerce.number().min(0, 'Reimbursements cannot be negative.'),
  // Bank Details
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchCode: z.string().optional(),
}).refine(data => {
    if (data.workerType === 'Hourly' && (data.hourlyRate === undefined || data.hoursWorked === undefined)) {
        return false;
    }
    return true;
}, {
    message: "Hourly rate and hours worked are required for Hourly employees.",
    path: ["hourlyRate"],
});

type EditEmployeeFormValues = z.infer<typeof formSchema>;

interface EditEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
  departments: Department[];
  banks: Bank[];
  onEmployeeUpdated: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
});


export function EditEmployeeDialog({
  children,
  employee,
  departments,
  banks,
  onEmployeeUpdated,
}: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...employee,
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
    },
  });

  const workerType = form.watch('workerType');
  const departmentId = form.watch('departmentId');
  
  const selectedDepartment = useMemo(() => {
    return departments.find(d => d.id === departmentId);
  }, [departmentId, departments]);

  async function onSubmit(values: EditEmployeeFormValues) {
    setIsLoading(true);
    
    try {
      const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';
      
      const updatedEmployeeData: Partial<Employee> = {
          ...values,
          departmentName,
          salary: values.salary || 0,
          hourlyRate: values.hourlyRate || 0,
          hoursWorked: values.hoursWorked || 0,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
      };

      await update(ref(db, 'employees/' + employee.id), updatedEmployeeData);
      
      onEmployeeUpdated();
      
      setOpen(false);
      toast({
        title: 'Employee Updated',
        description: `${values.name}'s profile has been successfully updated.`,
      });

    } catch (error: any) {
        console.error("Error updating employee:", error);
        toast({
            variant: "destructive",
            title: "Failed to update employee",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
          <DialogDescription>
            Update the details for {employee.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <h3 className="text-lg font-semibold">Personal & Account Details</h3>
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        disabled // Email should not be changed as it's the login
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                captionLayout="dropdown-nav"
                                fromYear={1960}
                                toYear={new Date().getFullYear() - 18}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <Separator />
                <h3 className="text-lg font-semibold">Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="identificationType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Document Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ID Number">ID Number</SelectItem>
                                    <SelectItem value="Passport">Passport</SelectItem>
                                    <SelectItem value="License">License</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="identificationNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Document Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter document number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Employment Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                            <Input placeholder="Software Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Department</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                                <SelectItem value="On Leave">On Leave</SelectItem>
                                <SelectItem value="Sick">Sick</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder="Lusaka, Zambia" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Compensation Details</h3>
                
                <FormField
                    control={form.control}
                    name="workerType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Worker Type</FormLabel>
                        <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        >
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select worker type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Salaried">Salaried</SelectItem>
                            <SelectItem value="Hourly">Hourly</SelectItem>
                            <SelectItem value="Contractor">Contractor</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {workerType === 'Salaried' && selectedDepartment && (
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Salary</FormLabel>
                            <FormControl>
                                <div className="space-y-4">
                                    <Slider
                                        min={selectedDepartment.minSalary}
                                        max={selectedDepartment.maxSalary}
                                        step={100}
                                        value={[field.value || selectedDepartment.minSalary]}
                                        onValueChange={(value) => field.onChange(value[0])}
                                    />
                                    <div className="text-center font-medium text-primary">
                                        {currencyFormatter.format(field.value || selectedDepartment.minSalary)}
                                    </div>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                 {workerType === 'Salaried' && !selectedDepartment && (
                    <div className="text-sm text-muted-foreground">
                        Please select a department to set the salary.
                    </div>
                )}
                {workerType === 'Hourly' && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="hourlyRate"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hourly Rate</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hoursWorked"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hours Worked</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                )}
                 {workerType === 'Contractor' && (
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contract Amount</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="allowances"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Allowances</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deductions"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deductions</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="overtime"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Overtime</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bonus"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bonus</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="reimbursements"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reimbursements</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <Separator />
                <h3 className="text-lg font-semibold">Bank Details (Optional)</h3>
                <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a bank" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className="h-40">
                                {banks.map(bank => (
                                    <SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>
                                ))}
                               </ScrollArea>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter account number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="branchCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter branch code" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <DialogFooter className="sticky bottom-0 bg-background py-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                    ) : (
                    'Save Changes'
                    )}
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
