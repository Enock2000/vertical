// src/app/dashboard/recruitment/components/reject-applicant-dialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, XCircle } from 'lucide-react';
import type { Applicant, JobVacancy } from '@/lib/data';
import { rejectApplicant } from '@/ai/flows/reject-applicant-flow';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  rejectionReason: z.string().min(10, 'A reason for rejection is required.'),
  sendEmail: z.boolean().default(true),
});

type RejectApplicantFormValues = z.infer<typeof formSchema>;

interface RejectApplicantDialogProps {
  children: React.ReactNode;
  applicant: Applicant;
  vacancy: JobVacancy;
}

export function RejectApplicantDialog({ children, applicant, vacancy }: RejectApplicantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RejectApplicantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rejectionReason: "Thank you for your interest in the position. After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.",
      sendEmail: true,
    },
  });

  async function onSubmit(values: RejectApplicantFormValues) {
    setIsLoading(true);
    try {
        const result = await rejectApplicant({
            applicantId: applicant.id,
            companyId: applicant.companyId,
            applicantName: applicant.name,
            applicantEmail: applicant.email,
            jobTitle: vacancy.title,
            ...values,
        });

        if (result.success) {
            toast({
                title: 'Applicant Rejected',
                description: result.message,
            });
            setOpen(false);
        } else {
             toast({ variant: 'destructive', title: 'Action Failed', description: result.message });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'An Error Occurred', description: 'Could not reject the applicant.' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Application for {applicant.name}</DialogTitle>
          <DialogDescription>
            Provide a reason for rejection. This will move the applicant to the "Rejected" column.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Rejection</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Lacks required experience in X."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Send rejection email
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      An email will be sent to the applicant informing them of the decision.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
