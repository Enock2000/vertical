// src/app/dashboard/performance/components/add-course-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import type { TrainingCourse, Question } from '@/lib/data';
import { useAuth } from '@/app/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question text cannot be empty.'),
  type: z.enum(['multiple-choice', 'short-answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.string().min(2, 'Category must be at least 2 characters.'),
  duration: z.coerce.number().min(0.5, 'Duration must be at least 0.5 hours.'),
  questions: z.array(questionSchema).min(1, 'You must add at least one question.'),
});

type AddCourseFormValues = z.infer<typeof formSchema>;

interface AddCourseDialogProps {
  children: React.ReactNode;
}

export function AddCourseDialog({ children }: AddCourseDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddCourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      duration: 1,
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  async function onSubmit(values: AddCourseFormValues) {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const coursesRef = ref(db, `companies/${companyId}/trainingCourses`);
      const newCourseRef = push(coursesRef);
      
      const newCourse: Omit<TrainingCourse, 'id'> = { 
        ...values, 
        companyId,
        questions: values.questions.map(q => ({
            ...q,
            id: push(ref(db)).key!, // Give each question a unique ID
            options: q.type === 'multiple-choice' ? q.options : [],
        }))
      };

      await set(newCourseRef, {...newCourse, id: newCourseRef.key});
      
      setOpen(false);
      form.reset();
      toast({
        title: 'Course Created',
        description: `The training course "${values.title}" has been created.`,
      });
    } catch (error: any) {
        console.error("Error adding course:", error);
        toast({
            variant: "destructive",
            title: "Failed to add course",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Training Course</DialogTitle>
          <DialogDescription>
            Build a new training module with a title, description, and custom questions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Company Security Policy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this training..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Leadership, Technical" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Questions</h3>
              <div className="space-y-4">
                {fields.map((field, index) => {
                    const questionType = form.watch(`questions.${index}.type`);
                    const options = form.watch(`questions.${index}.options`) || [];
                    return (
                        <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/50 relative">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <FormField
                                control={form.control}
                                name={`questions.${index}.text`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question {index + 1}</FormLabel>
                                        <FormControl><Input {...field} placeholder="Enter your question" /></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`questions.${index}.type`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select question type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="short-answer">Short Answer</SelectItem>
                                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {questionType === 'multiple-choice' && (
                                <div className="pl-4 border-l-2 space-y-3">
                                    <FormField
                                        control={form.control}
                                        name={`questions.${index}.options`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Options</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        {...field}
                                                        placeholder="Enter options, comma separated"
                                                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                                        value={(field.value || []).join(', ')}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`questions.${index}.correctAnswer`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Correct Answer</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select the correct option" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {options.map((opt, i) => (
                                                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                            {questionType === 'short-answer' && (
                                 <FormField
                                    control={form.control}
                                    name={`questions.${index}.correctAnswer`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correct Answer (Optional)</FormLabel>
                                            <FormControl><Input {...field} placeholder="Enter the ideal answer" /></FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
                 <Button type="button" variant="outline" onClick={() => append({ text: '', type: 'short-answer', options: [], correctAnswer: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background py-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Course'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
