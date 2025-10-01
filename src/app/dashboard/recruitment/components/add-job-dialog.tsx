

// src/app/dashboard/recruitment/components/add-job-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set, runTransaction } from 'firebase/database';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Department, JobVacancy } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';

const formSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
});

type AddJobFormValues = z.infer<typeof formSchema>;

interface AddJobDialogProps {
  children: React.ReactNode;
  departments: Department[];
  onJobAdded: () => void;
}

export function AddJobDialog({
  children,
  departments,
  onJobAdded,
}: AddJobDialogProps) {
  const { company } = useAuth();
  const companyId = company?.id;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      departmentId: '',
      description: '',
    },
  });

  async function onSubmit(values: AddJobFormValues) {
    if (!companyId || !company?.subscription) return;

    if (company.subscription.jobPostingsRemaining <= 0) {
        toast({
            variant: 'destructive',
            title: 'Posting Limit Reached',
            description: 'You have reached your job posting limit. Please upgrade your plan to post more jobs.',
        });
        return;
    }

    setIsLoading(true);
    try {
      // Decrement job postings remaining
      await runTransaction(ref(db, `companies/${companyId}/subscription/jobPostingsRemaining`), (currentValue) => {
          return (currentValue || 0) - 1;
      });

      const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
      const newJobRef = push(jobsRef);
      const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';

      const newJob: Omit<JobVacancy, 'id' | 'companyId'> = {
        title: values.title,
        departmentId: values.departmentId,
        departmentName,
        description: values.description,
        status: 'Open',
        createdAt: new Date().toISOString(),
      };
      
      await set(newJobRef, { ...newJob, id: newJobRef.key });

      onJobAdded();
      setOpen(false);
      form.reset();
      toast({
        title: 'Job Vacancy Posted',
        description: `The "${values.title}" position has been successfully posted.`,
      });
    } catch (error: any) {
      console.error('Error adding job:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to post job',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post New Job Vacancy</DialogTitle>
          <DialogDescription>
            You have {company?.subscription?.jobPostingsRemaining || 0} job postings remaining.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Frontend Developer" {...field} />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the role and responsibilities..." rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading || (company?.subscription?.jobPostingsRemaining || 0) <= 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
