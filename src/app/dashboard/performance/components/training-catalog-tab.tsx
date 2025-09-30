
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, UserPlus, HelpCircle } from 'lucide-react';
import type { TrainingCourse, Employee } from '@/lib/data';
import { AddCourseDialog } from "./add-course-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, set, push } from "firebase/database";
import { useAuth } from "@/app/auth-provider";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


interface EnrollEmployeePopoverProps {
    course: TrainingCourse;
    employees: Employee[];
}

function EnrollEmployeePopover({ course, employees }: EnrollEmployeePopoverProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const handleEnroll = async (employeeId: string) => {
        if (!companyId) return;
        
        try {
            const enrollmentsRef = ref(db, `companies/${companyId}/enrollments`);
            const newEnrollmentRef = push(enrollmentsRef);
            await set(newEnrollmentRef, {
                id: newEnrollmentRef.key,
                companyId,
                employeeId,
                courseId: course.id,
                enrollmentDate: new Date().toISOString(),
                status: 'Enrolled'
            });
            
            const employee = employees.find(e => e.id === employeeId);
            toast({
                title: "Enrollment Successful",
                description: `${employee?.name} has been enrolled in "${course.title}".`
            });
            setOpen(false);
        } catch (error) {
            console.error("Enrollment failed", error);
            toast({ variant: 'destructive', title: "Enrollment Failed" });
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                 <Button variant="secondary" size="sm" className="mt-4 w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enroll Employee
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandList>
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                        {employees.map((employee) => (
                            <CommandItem
                                key={employee.id}
                                onSelect={() => handleEnroll(employee.id)}
                            >
                                {employee.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}


interface CourseItemProps {
    course: TrainingCourse;
    employees: Employee[];
}

function CourseItem({ course, employees }: CourseItemProps) {
    return (
        <div className="border p-4 rounded-lg flex flex-col h-full bg-card">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{course.title}</h3>
                     <Badge variant="secondary" className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        {course.questions?.length || 0} Questions
                    </Badge>
                </div>
                <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{course.description}</p>
            </div>
            <EnrollEmployeePopover course={course} employees={employees} />
        </div>
    );
}

interface TrainingCatalogTabProps {
    courses: TrainingCourse[];
    employees: Employee[];
}

export function TrainingCatalogTab({ courses, employees }: TrainingCatalogTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Training Catalog</CardTitle>
            <CardDescription>
            Create and manage quiz-based training modules for employees.
            </CardDescription>
        </div>
        <AddCourseDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Course
            </Button>
        </AddCourseDialog>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(course => (
                    <CourseItem key={course.id} course={course} employees={employees} />
                ))}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No training courses found.</p>
                <p className="text-sm text-muted-foreground">Click "Create Course" to build your first training module.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
