'use client';

import { useState } from 'react';
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
import type { Employee } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.string().min(2, 'Role must be at least 2 characters.'),
  status: z.enum(['Active', 'Inactive']),
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
}).refine(data => {
    if (data.workerType === 'Salaried' && data.salary === undefined) {
        return false;
    }
    return true;
}, {
    message: "Salary is required for Salaried employees.",
    path: ["salary"],
}).refine(data => {
    if (data.workerType === 'Hourly' && (data.hourlyRate === undefined || data.hoursWorked === undefined)) {
        return false;
    }
    return true;
}, {
    message: "Hourly rate and hours worked are required for Hourly employees.",
    path: ["hourlyRate"],
});

type AddEmployeeFormValues = z.infer<typeof formSchema>;

interface AddEmployeeDialogProps {
  children: React.ReactNode;
  onEmployeeAdded: () => void;
}

export function AddEmployeeDialog({
  children,
  onEmployeeAdded,
}: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      status: 'Active',
      location: '',
      workerType: 'Salaried',
      salary: 0,
      hourlyRate: 0,
      hoursWorked: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      reimbursements: 0,
    },
  });

  const workerType = form.watch('workerType');

  async function onSubmit(values: AddEmployeeFormValues) {
    setIsLoading(true);
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const { password, ...employeeData } = values;
      const newEmployee: Omit<Employee, 'id'> = {
          ...employeeData,
          avatar: `https://avatar.vercel.sh/${values.email}.png`,
          salary: values.salary || 0,
          hourlyRate: values.hourlyRate || 0,
          hoursWorked: values.hoursWorked || 0,
      };

      // Save employee data to Realtime Database
      await set(ref(db, 'employees/' + user.uid), {
        ...newEmployee,
        id: user.uid
      });
      
      onEmployeeAdded();
      
      setOpen(false);
      form.reset();
      toast({
        title: 'Employee Added',
        description: `${values.name} has been successfully added with a login account.`,
      });

    } catch (error: any) {
        console.error("Error adding employee:", error);
        toast({
            variant: "destructive",
            title: "Failed to add employee",
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
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new employee and create their portal account.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email (for login)</FormLabel>
                        <FormControl>
                            <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Initial Password</FormLabel>
                        <FormControl>
                            <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
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
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
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

                {workerType === 'Salaried' && (
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Salary</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
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
                <DialogFooter className="sticky bottom-0 bg-background py-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                    ) : (
                    'Save Employee'
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
