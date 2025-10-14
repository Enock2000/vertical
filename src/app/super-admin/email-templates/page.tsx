
// src/app/super-admin/email-templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const templateSchema = z.object({
  subject: z.string().min(5, 'Subject is required.'),
  htmlContent: z.string().min(20, 'Email content is required.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const templateFields: { id: 'welcomePending' | 'companyApproved' | 'companySuspended' | 'newEmployeeWelcome', name: string }[] = [
    { id: 'welcomePending', name: 'Company Welcome & Pending Review' },
    { id: 'companyApproved', name: 'Company Registration Approved' },
    { id: 'companySuspended', name: 'Company Account Suspended' },
    { id: 'newEmployeeWelcome', name: 'New Employee Welcome' },
];

const EmailTemplateForm = ({ templateId, templateName }: { templateId: string, templateName: string }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: { subject: '', htmlContent: '' }
    });

    useEffect(() => {
        const templateRef = ref(db, `platformSettings/emailTemplates/${templateId}`);
        const unsubscribe = onValue(templateRef, (snapshot) => {
            if (snapshot.exists()) {
                form.reset(snapshot.val());
            }
        });
        return () => unsubscribe();
    }, [templateId, form]);

    const onSubmit = async (values: TemplateFormValues) => {
        setIsLoading(true);
        try {
            await set(ref(db, `platformSettings/emailTemplates/${templateId}`), values);
            toast({ title: "Template Saved", description: `The "${templateName}" email template has been updated.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the email template.'});
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="htmlContent"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Body (HTML)</FormLabel>
                        <FormControl><Textarea rows={15} {...field} /></FormControl>
                        <FormDescription>
                            You can use placeholders like {'{{companyName}}'}, {'{{contactName}}'}, or {'{{employeeName}}'}.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                </Button>
            </form>
        </Form>
    )
}

export default function SuperAdminEmailTemplatesPage() {
    const { user, employee, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && (!user || employee?.role !== 'Super Admin')) {
            router.push('/login');
        }
    }, [user, employee, authLoading, router]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!employee || employee.role !== 'Super Admin') return null;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Logo />
                    <h1 className="text-lg font-semibold">Super Admin Portal</h1>
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className='flex items-center gap-4'>
                            <Button variant="outline" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Email Template Management</CardTitle>
                                <CardDescription>
                                    Customize the automated emails sent to companies and employees.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={templateFields[0].id} className="w-full">
                            <TabsList>
                                {templateFields.map(template => (
                                     <TabsTrigger key={template.id} value={template.id}>{template.name}</TabsTrigger>
                                ))}
                            </TabsList>
                            {templateFields.map(template => (
                                <TabsContent key={template.id} value={template.id}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{template.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <EmailTemplateForm templateId={template.id} templateName={template.name} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
