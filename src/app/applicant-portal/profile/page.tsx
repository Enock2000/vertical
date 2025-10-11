
// src/app/applicant-portal/profile/page.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/app/auth-provider';
import { Loader2, Trash2, PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution is required"),
  qualification: z.string().min(1, "Qualification is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
});

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  education: z.array(educationSchema).optional(),
  workExperience: z.array(experienceSchema).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ApplicantProfilePage() {
  const { employee, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: employee?.name || '',
      phone: employee?.phone || '',
      location: employee?.location || '',
      education: employee?.education || [],
      workExperience: employee?.workExperience || [],
    },
  });
  
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: form.control,
    name: 'workExperience',
  });
  
  const onSubmit = async (data: ProfileFormValues) => {
    if (!employee) return;
    setIsSaving(true);
    try {
      await update(dbRef(db, `employees/${employee.id}`), data);
      toast({ title: "Profile updated successfully!" });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const fileRef = storageRef(storage, `resumes/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const resumeUrl = await getDownloadURL(snapshot.ref);
      await update(dbRef(db, `employees/${user.uid}`), { resumeUrl });
      toast({ title: "Resume uploaded successfully!" });
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Failed to upload resume." });
    } finally {
        setIsUploading(false);
    }
  }


  if (authLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }
  
  if (!employee) {
    return <p>Could not load your profile.</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Manage your personal contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <Input value={employee.email} disabled />
              </FormItem>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Resume</CardTitle>
                <CardDescription>Upload and manage your resume file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={isUploading}/>
                {isUploading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</p>}
                 {employee.resumeUrl && !isUploading && (
                    <p className="text-sm text-green-600">
                        A resume is on file. You can upload a new one to replace it.
                    </p>
                )}
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
            <CardDescription>Add your educational background.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {eduFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEdu(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (
                    <FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name={`education.${index}.qualification`} render={({ field }) => (
                      <FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name={`education.${index}.fieldOfStudy`} render={({ field }) => (
                      <FormItem><FormLabel>Field of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name={`education.${index}.startDate`} render={({ field }) => (
                      <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                      <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendEdu({ institution: '', qualification: '', fieldOfStudy: '', startDate: '', endDate: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>Detail your professional history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                 <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeExp(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name={`workExperience.${index}.company`} render={({ field }) => (
                      <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name={`workExperience.${index}.position`} render={({ field }) => (
                      <FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name={`workExperience.${index}.startDate`} render={({ field }) => (
                      <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name={`workExperience.${index}.endDate`} render={({ field }) => (
                      <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                <FormField control={form.control} name={`workExperience.${index}.responsibilities`} render={({ field }) => (
                    <FormItem><FormLabel>Responsibilities</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
            ))}
             <Button type="button" variant="outline" onClick={() => appendExp({ company: '', position: '', startDate: '', endDate: '', responsibilities: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Profile'}
        </Button>
      </form>
    </Form>
  );
}
