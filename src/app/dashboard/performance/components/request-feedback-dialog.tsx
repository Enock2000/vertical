'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
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
import { Loader2, UserPlus, Send } from 'lucide-react';
import type { Employee, Feedback } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const formSchema = z.object({
  feedbackProviders: z.array(z.string()).min(1, 'You must select at least one feedback provider.'),
  prompt: z.string().min(10, 'The prompt must be at least 10 characters.'),
  isAnonymous: z.boolean().default(false),
});

type RequestFeedbackFormValues = z.infer<typeof formSchema>;

interface RequestFeedbackDialogProps {
  children: React.ReactNode;
  subjectEmployee: Employee;
  employees: Employee[];
}

export function RequestFeedbackDialog({
  children,
  subjectEmployee,
  employees
}: RequestFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestFeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedbackProviders: [],
      prompt: `What is your feedback for ${subjectEmployee.name} regarding their recent project performance?`,
      isAnonymous: false,
    },
  });

  async function onSubmit(values: RequestFeedbackFormValues) {
    setIsLoading(true);
    try {
      // In a real application, you would create a "feedbackRequest" record
      // and notify the selected employees to provide their feedback.
      // For this simulation, we'll just show a success message.
      console.log("Feedback Request Submitted:", {
        subject: subjectEmployee.id,
        ...values,
      });

      // Here is where you would typically loop through `values.feedbackProviders`
      // and create individual feedback request records in your database,
      // then trigger notifications (e.g., via email or an in-app system).

      toast({
        title: 'Feedback Request Sent',
        description: `Requests for feedback about ${subjectEmployee.name} have been sent out.`,
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error requesting feedback:", error);
      toast({
        variant: "destructive",
        title: "Failed to request feedback",
        description: error.message || "An unexpected error occurred."
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
          <DialogTitle>Request Feedback for {subjectEmployee.name}</DialogTitle>
          <DialogDescription>
            Select employees to provide feedback and write a prompt for them.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedbackProviders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Providers</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                            <UserPlus className="mr-2"/>
                            Select Employees
                            <span className="ml-2 rounded-md bg-secondary px-2 py-1 text-xs">
                                {field.value.length} selected
                            </span>
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                       <Command>
                            <CommandInput placeholder="Search employees..." />
                            <CommandList>
                                <CommandEmpty>No employees found.</CommandEmpty>
                                <CommandGroup>
                                    {employees.map((employee) => (
                                        <CommandItem
                                            key={employee.id}
                                            onSelect={() => {
                                                const selected = field.value.includes(employee.id)
                                                    ? field.value.filter((id) => id !== employee.id)
                                                    : [...field.value, employee.id];
                                                field.onChange(selected);
                                            }}
                                        >
                                           <Checkbox
                                                className="mr-2"
                                                checked={field.value.includes(employee.id)}
                                            />
                                            {employee.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., What are some areas where this employee excels?"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                Collect feedback anonymously
                            </FormLabel>
                        </div>
                    </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
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
