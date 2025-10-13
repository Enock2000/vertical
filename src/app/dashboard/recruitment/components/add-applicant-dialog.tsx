// src/app/dashboard/recruitment/components/add-applicant-dialog.tsx
'use client';

import { useState, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { JobVacancy } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { addManualApplicant } from '@/ai/flows/add-manual-applicant-flow';

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
  source: z.string().optional(),
  resume: z.any().optional(),
});

type AddApplicantFormValues = z.infer<typeof formSchema>;

interface AddApplicantDialogProps {
  children: React.ReactNode;
  vacancy: JobVacancy;
}

export function AddApplicantDialog({ children, vacancy }: AddApplicantDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<AddApplicantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: 'Manual Entry',
    },
  });

  async function onSubmit(values: AddApplicantFormValues) {
    if (!formRef.current || !companyId) return;
    setIsLoading(true);

    const formData = new FormData(formRef.current);
    formData.append('companyId', companyId);
    formData.append('jobVacancyId', vacancy.id);
    formData.append('vacancyTitle', vacancy.title);

    try {
      const result = await addManualApplicant(formData);
      if (result.success) {
        toast({ title: 'Applicant Added', description: `"${values.name}" has been added to this vacancy.` });
        form.reset();
        setFileName('');
        setOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Submission Failed', description: result.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'An Error Occurred', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manually Add Applicant</DialogTitle>
          <DialogDescription>
            Add a candidate who applied via email or another external source to the "{vacancy.title}" vacancy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
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
                  <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                name="source"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Email, Referral" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>Resume</FormLabel>
                        <FormControl>
                            <div>
                                <Input 
                                    type="file" 
                                    className="hidden"
                                    ref={rest.ref}
                                    name={rest.name}
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        onChange(file);
                                        setFileName(file?.name || '');
                                    }}
                                />
                                <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => formRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {fileName || 'Upload resume file'}
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Adding Applicant...</> : 'Add Applicant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
