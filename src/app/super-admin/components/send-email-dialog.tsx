// src/app/super-admin/components/send-email-dialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import type { Company } from '@/lib/data';
import { sendEmail } from '@/ai/flows/send-email-flow';

const formSchema = z.object({
  subject: z.string().min(3, 'Subject is required.'),
  htmlContent: z.string().min(10, 'Message body is required.'),
});

type SendEmailFormValues = z.infer<typeof formSchema>;

interface SendEmailDialogProps {
  children: React.ReactNode;
  company: Company;
}

export function SendEmailDialog({ children, company }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SendEmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      htmlContent: '',
    },
  });

  async function onSubmit(values: SendEmailFormValues) {
    setIsLoading(true);
    try {
      const result = await sendEmail({
        to: [{ email: company.adminEmail, name: company.contactName }],
        subject: values.subject,
        htmlContent: values.htmlContent,
      });

      if (result.success) {
        setOpen(false);
        form.reset();
        toast({
          title: 'Email Sent',
          description: `Your message has been sent to ${company.name}.`,
        });
      } else {
        throw new Error('Failed to send email.');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send',
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
          <DialogTitle>Send Email to {company.name}</DialogTitle>
          <DialogDescription>
            Compose and send a direct email to {company.adminEmail}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Regarding your account..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={8}
                      placeholder="Dear [Company Name]..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Email
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
