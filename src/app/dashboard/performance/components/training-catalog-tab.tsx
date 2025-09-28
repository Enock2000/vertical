'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, UserPlus } from 'lucide-react';
import type { TrainingCourse } from '@/lib/data';
import { AddCourseDialog } from "./add-course-dialog";
import { Badge } from "@/components/ui/badge";

interface CourseItemProps {
    course: TrainingCourse;
}

function CourseItem({ course }: CourseItemProps) {
    return (
        <div className="border p-4 rounded-lg flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant="outline">{course.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Provided by {course.provider} &bull; {course.duration}
                </p>
                <p className="text-sm mt-2">{course.description}</p>
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Employee
            </Button>
        </div>
    );
}

interface TrainingCatalogTabProps {
    courses: TrainingCourse[];
}

export function TrainingCatalogTab({ courses }: TrainingCatalogTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Training Catalog</CardTitle>
            <CardDescription>
            Browse and manage available training courses for employees.
            </CardDescription>
        </div>
        <AddCourseDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Course
            </Button>
        </AddCourseDialog>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(course => (
                    <CourseItem key={course.id} course={course} />
                ))}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No training courses found.</p>
                <p className="text-sm text-muted-foreground">Click "Add Course" to build your catalog.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
