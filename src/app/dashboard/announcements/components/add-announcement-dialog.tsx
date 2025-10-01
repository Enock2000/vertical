// src/app/dashboard/announcements/components/add-announcement-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set, update } from 'firebase/database';
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
import { Loader2, Check } from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import type { Announcement, Department } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';


const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  content: z.string().min(20, 'Content must be at least 20 characters.'),
  audienceType: z.enum(['all', 'specific']),
  departments: z.array(z.string()).optional(),
}).refine(data => {
    if (data.audienceType === 'specific' && (!data.departments || data.departments.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "You must select at least one department for a specific audience.",
    path: ["departments"],
});

type AddAnnouncementFormValues = z.infer<typeof formSchema>;

interface AddAnnouncementDialogProps {
  children: React.ReactNode;
  departments: Department[];
  announcement?: Announcement;
}

export function AddAnnouncementDialog({
  children,
  departments,
  announcement,
}: AddAnnouncementDialogProps) {
  const { companyId, employee } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const isEditMode = !!announcement;

  const form = useForm<AddAnnouncementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
        title: announcement.title,
        content: announcement.content,
        audienceType: announcement.audience === 'all' ? 'all' : 'specific',
        departments: Array.isArray(announcement.audience) ? announcement.audience : [],
    } : {
      title: '',
      content: '',
      audienceType: 'all',
      departments: [],
    },
  });

  const audienceType = form.watch('audienceType');

  async function onSubmit(values: AddAnnouncementFormValues) {
    if (!companyId || !employee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication details not found.' });
        return;
    }
    setIsLoading(true);

    try {
        const announcementData: Omit<Announcement, 'id' | 'companyId'> = {
            title: values.title,
            content: values.content,
            authorName: employee.name,
            createdAt: announcement?.createdAt || new Date().toISOString(),
            audience: values.audienceType === 'all' ? 'all' : values.departments!,
        };

        if (isEditMode) {
             const announcementRef = ref(db, `companies/${companyId}/announcements/${announcement.id}`);
             await update(announcementRef, announcementData);
             toast({ title: 'Announcement Updated', description: `"${values.title}" has been updated.` });
        } else {
            const announcementsRef = ref(db, `companies/${companyId}/announcements`);
            const newAnnouncementRef = push(announcementsRef);
            await set(newAnnouncementRef, { ...announcementData, id: newAnnouncementRef.key, companyId });
            toast({ title: 'Announcement Published', description: `"${values.title}" has been published.` });
        }

      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Create'} Announcement</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify the details of the announcement.' : 'Write and publish a new announcement to your team.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Q3 All-Hands Meeting" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea placeholder="Write your announcement here..." rows={8} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="audienceType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Audience</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="all" /></FormControl>
                                <FormLabel className="font-normal">All Employees</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="specific" /></FormControl>
                                <FormLabel className="font-normal">Specific Departments</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {audienceType === 'specific' && (
                 <FormField
                    control={form.control}
                    name="departments"
                    render={() => (
                        <FormItem className="rounded-md border p-4">
                             <div className="mb-4">
                                <FormLabel className="text-base">Select Departments</FormLabel>
                            </div>
                            <div className="space-y-2">
                                {departments.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="departments"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), item.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {item.name}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Publish Announcement'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
