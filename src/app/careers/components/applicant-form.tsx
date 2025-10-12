// src/app/careers/components/applicant-form.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { JobVacancy, ApplicationFormQuestion } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { handleApplication } from '@/ai/flows/handle-application-flow';

function CustomFormInput({ question, control }: { question: ApplicationFormQuestion; control: any }) {
  return (
    <FormField
      control={control}
      name={`answers.${question.id}`}
      rules={{ required: question.required ? "This field is required." : false }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{question.text} {question.required && <span className="text-destructive">*</span>}</FormLabel>
          <FormControl>
            {question.type === 'textarea' ? (
              <Textarea {...field} />
            ) : question.type === 'yesno' ? (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
                  <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id={`${question.id}-no`} />
                  <Label htmlFor={`${question.id}-no`}>No</Label>
                </div>
              </RadioGroup>
            ) : (
              <Input {...field} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
  resume: z.any().optional(),
  answers: z.record(z.string()).optional(),
});

type ApplicantFormValues = z.infer<typeof formSchema>;

interface ApplicantFormProps {
  job: JobVacancy;
  onSubmitted: () => void;
}

export function ApplicantForm({ job, onSubmitted }: ApplicantFormProps) {
  const { user, employee } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const form = useForm<ApplicantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      answers: {},
    },
  });

  const handleSubmit = async (values: ApplicantFormValues) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('companyId', job.companyId);
    formData.append('jobVacancyId', job.id);
    formData.append('vacancyTitle', job.title);
    formData.append('name', values.name);
    formData.append('email', values.email);
    if(values.phone) formData.append('phone', values.phone);
    if(values.resume) formData.append('resume', values.resume);
    if(values.answers) {
        Object.entries(values.answers).forEach(([key, value]) => {
            formData.append(`answers.${key}`, value);
        });
    }

    try {
      const result = await handleApplication(formData);
      if (result.success) {
        toast({ title: 'Application Submitted!', description: result.message });
        onSubmitted();
        router.push(user ? '/applicant-portal' : '/careers');
      } else {
        toast({ variant: 'destructive', title: 'Submission Failed', description: result.message });
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An Error Occurred', description: 'Could not submit application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} disabled={!!user} /></FormControl>
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
                    <FormControl><Input type="email" {...field} disabled={!!user} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="resume"
            render={({ field: { onChange, ...fieldProps } }) => (
                 <FormItem>
                    <FormLabel>Resume</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                onChange(file);
                                setFileName(file?.name || '');
                            }}
                            {...fieldProps}
                         />
                    </FormControl>
                    <FormDescription>{employee?.resumeUrl ? 'You have a resume on file. Uploading a new one will replace it for this application.' : 'Please upload your resume.'}</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {job.customForm && job.customForm.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
                {job.customForm.map(q => <CustomFormInput key={q.id} question={q} control={form.control} />)}
            </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
          Submit Application
        </Button>
      </form>
    </Form>
  );
}
