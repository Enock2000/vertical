
// src/app/post-a-job/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Logo from "@/components/logo";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { handleGuestJobPosting } from '@/ai/flows/post-guest-job-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const customQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question cannot be empty.'),
  type: z.enum(['text', 'textarea', 'yesno']),
  required: z.boolean(),
});

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  companyEmail: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  title: z.string().min(3, 'Job title is required.'),
  departmentName: z.string().min(2, 'Department is required.'),
  description: z.string().min(20, 'Please provide a detailed description.'),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salary: z.coerce.number().optional(),
  jobType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Remote']).optional(),
  closingDate: z.date({ required_error: 'A closing date is required.' }),
  applicationMethod: z.enum(['internal', 'email']).default('internal'),
  applicationEmail: z.string().email().optional().or(z.literal('')),
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

type GuestJobFormValues = z.infer<typeof formSchema>;

export default function PostAJobPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<GuestJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      companyEmail: '',
      password: '',
      title: '',
      departmentName: '',
      description: '',
      requirements: '',
      location: '',
      salary: undefined,
      jobType: undefined,
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

  const onSubmit = async (values: GuestJobFormValues) => {
    setIsLoading(true);
    try {
      const result = await handleGuestJobPosting({
        ...values,
        closingDate: values.closingDate.toISOString(),
      });
      
      if (result.success) {
        toast({
          title: 'Job Submitted & Account Created',
          description: "Your job is pending approval. You can now log in to view its status.",
        });
        form.reset();
        router.push('/guest-employer');
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Could not submit your job posting. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <Logo />
                <Button variant="ghost" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 py-12">
            <div className="container max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Post a Job & Create a Guest Account</CardTitle>
                        <CardDescription>
                            Fill out the form below to post a job vacancy. An account will be created for you to track applicants. All submissions are subject to review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <h3 className="text-lg font-semibold">Company & Account Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your Company Inc." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="companyEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Your Email (for login)</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Create Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <h3 className="text-lg font-semibold">Job Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Marketing Manager" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="departmentName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Department</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Marketing" {...field} />
                                                </FormControl>
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
                                    name="salary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Salary (ZMW, Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="e.g., 15000" {...field} />
                                            </FormControl>
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
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date()}/>
                                            </PopoverContent>
                                        </Popover>
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
                                <FormField
                                    control={form.control}
                                    name="requirements"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Requirements (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="List key skills and qualifications..." rows={4} {...field} />
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
                                        <h3 className="text-lg font-semibold mb-2">Custom Application Form (Optional)</h3>
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
                                                            <FormMessage/>
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
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit for Review
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                 </Card>
            </div>
        </main>
    </div>
  );
}
