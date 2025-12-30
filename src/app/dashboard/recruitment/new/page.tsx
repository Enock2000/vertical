// src/app/dashboard/recruitment/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set, runTransaction, onValue } from 'firebase/database';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import type { Department, JobVacancy, ApplicationFormQuestion } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const customQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question cannot be empty.'),
  type: z.enum(['text', 'textarea', 'yesno']),
  required: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  location: z.string().optional(),
  jobType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Remote']).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  closingDate: z.date({ required_error: "A closing date is required." }),
  applicationMethod: z.enum(['internal', 'email']).default('internal'),
  applicationEmail: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  customForm: z.array(customQuestionSchema).optional(),
}).refine(data => {
  if (data.applicationMethod === 'email' && !data.applicationEmail) {
    return false;
  }
  return true;
}, {
  message: "Application email is required for this method.",
  path: ['applicationEmail'],
});

type AddJobFormValues = z.infer<typeof formSchema>;

export default function NewJobVacancyPage() {
  const { company } = useAuth();
  const companyId = company?.id;
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      departmentId: '',
      location: '',
      jobType: undefined,
      description: '',
      applicationMethod: 'internal',
      applicationEmail: '',
      customForm: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customForm',
  });

  const applicationMethod = form.watch('applicationMethod');

  useEffect(() => {
    if (companyId) {
      const deptsRef = ref(db, `companies/${companyId}/departments`);
      const unsubscribe = onValue(deptsRef, (snapshot) => {
        setDepartments(snapshot.val() ? Object.values(snapshot.val()) : []);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [companyId]);


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
      await runTransaction(ref(db, `companies/${companyId}/subscription/jobPostingsRemaining`), (currentValue) => {
        return (currentValue || 0) - 1;
      });

      const jobsRef = ref(db, `companies/${companyId}/jobVacancies`);
      const newJobRef = push(jobsRef);
      const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';

      const newJob: Record<string, any> = {
        title: values.title,
        departmentId: values.departmentId,
        departmentName,
        description: values.description,
        status: 'Open',
        createdAt: new Date().toISOString(),
        closingDate: values.closingDate.toISOString(),
        applicationMethod: values.applicationMethod,
        customForm: values.customForm?.map(q => ({ ...q, id: push(ref(db)).key! })) || [],
      };

      // Only add optional fields if they have values
      if (values.location) newJob.location = values.location;
      if (values.jobType) newJob.jobType = values.jobType;
      if (values.applicationEmail) newJob.applicationEmail = values.applicationEmail;

      await set(newJobRef, { ...newJob, id: newJobRef.key, companyId });

      toast({
        title: 'Job Vacancy Posted',
        description: `The "${values.title}" position has been successfully posted.`,
      });
      router.push('/dashboard/recruitment');

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

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Post New Job Vacancy</CardTitle>
              <CardDescription>
                You have {company?.subscription?.jobPostingsRemaining || 0} job postings remaining.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              <div className="grid grid-cols-2 gap-4">
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
                  name="closingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Closing Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date()} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lusaka, Zambia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Full-Time">Full-Time</SelectItem>
                          <SelectItem value="Part-Time">Part-Time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        placeholder="Describe the role and responsibilities..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="applicationMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Application Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="internal" /></FormControl>
                          <FormLabel className="font-normal">Internal Application Form</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="email" /></FormControl>
                          <FormLabel className="font-normal">External Email Submission</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {applicationMethod === 'email' && (
                <FormField
                  control={form.control}
                  name="applicationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="careers@yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {applicationMethod === 'internal' && (
                <>
                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Custom Application Form</h3>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-muted/50">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <FormField
                            control={form.control}
                            name={`customForm.${index}.text`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question {index + 1}</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., What are your salary expectations?" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center gap-4">
                            <FormField
                              control={form.control}
                              name={`customForm.${index}.type`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="text">Short Text</SelectItem>
                                      <SelectItem value="textarea">Long Text</SelectItem>
                                      <SelectItem value="yesno">Yes/No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`customForm.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-2 space-y-0 pt-8">
                                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                  <FormLabel>Required</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => append({ text: '', type: 'text', required: false })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
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
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}