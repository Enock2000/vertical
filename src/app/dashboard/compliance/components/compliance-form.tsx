'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getComplianceRecommendations } from '@/ai/flows/compliance-recommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  employeeLocation: z.string().min(2, {
    message: "Employee location must be at least 2 characters.",
  }),
  contractDetails: z.string().min(10, {
    message: "Contract details must be at least 10 characters.",
  }),
});

export default function ComplianceForm() {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeLocation: "",
      contractDetails: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await getComplianceRecommendations(values);
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error("Failed to get compliance recommendations:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get compliance recommendations. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="employeeLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Location</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., California, USA or London, UK"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Salary: $80,000/year, Health Insurance provided, 20 days paid vacation..."
                    rows={5}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Recommendations
                </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <Card>
            <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Our AI is analyzing the details to provide compliance recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
      )}

      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" /> AI Recommendations
            </CardTitle>
            <CardDescription>
              Based on the provided information, here are the compliance recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>{recommendations}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
