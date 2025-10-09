// src/app/dashboard/settings/components/testimonials-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import type { Testimonial } from '@/lib/data';

const formSchema = z.object({
  authorName: z.string().min(2, 'Your name is required.'),
  authorTitle: z.string().min(2, 'Your title is required.'),
  testimonialText: z.string().min(50, 'Testimonial must be at least 50 characters.'),
});

type TestimonialFormValues = z.infer<typeof formSchema>;

export function TestimonialsTab() {
  const { company, employee, companyId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [existingTestimonial, setExistingTestimonial] = useState<Testimonial | null>(null);
  const { toast } = useToast();

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authorName: '',
      authorTitle: '',
      testimonialText: '',
    },
  });

  useEffect(() => {
    if (companyId) {
        const testimonialQuery = query(ref(db, 'testimonials'), orderByChild('companyId'), equalTo(companyId));
        const unsubscribe = onValue(testimonialQuery, (snapshot) => {
            const data = snapshot.val();
            if(data) {
                const testimonial = Object.values(data)[0] as Testimonial;
                setExistingTestimonial(testimonial);
                form.reset({
                    authorName: testimonial.authorName,
                    authorTitle: testimonial.authorTitle,
                    testimonialText: testimonial.testimonialText,
                });
            }
        });
        return () => unsubscribe();
    }
  }, [companyId, form]);

  async function onSubmit(values: TestimonialFormValues) {
    if (!companyId || !company || !employee) return;
    setIsLoading(true);
    try {
        const testimonialId = existingTestimonial?.id || companyId; // Use companyId as a unique key
        const testimonialRef = ref(db, `testimonials/${testimonialId}`);
      
        const testimonialData: Testimonial = {
            id: testimonialId,
            companyId: companyId,
            companyName: company.name,
            authorName: values.authorName,
            authorTitle: values.authorTitle,
            testimonialText: values.testimonialText,
            status: 'Pending',
            createdAt: existingTestimonial?.createdAt || new Date().toISOString(),
        };

        await set(testimonialRef, testimonialData);

        toast({
            title: 'Testimonial Submitted',
            description: 'Thank you! Your testimonial is now pending approval from our team.',
        });
    } catch (error: any) {
        console.error('Error submitting testimonial:', error);
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Testimonial</CardTitle>
        <CardDescription>
          We'd love to hear your feedback! Share your experience with VerticalSync. Your testimonial may be featured on our homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
             <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="authorTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CEO, HR Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="testimonialText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Testimonial</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Share your experience..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                existingTestimonial ? 'Update Testimonial' : 'Submit Testimonial'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
