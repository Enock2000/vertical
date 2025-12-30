
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PlusCircle,
    BookOpen,
    UserPlus,
    HelpCircle,
    Clock,
    Users,
    GraduationCap,
    CheckCircle,
    PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingCourse, Employee, Enrollment } from '@/lib/data';
import { AddCourseDialog } from "./add-course-dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, set, push, onValue, query, orderByChild, equalTo } from "firebase/database";
import { useAuth } from "@/app/auth-provider";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


interface EnrollEmployeePopoverProps {
    course: TrainingCourse;
    employees: Employee[];
    enrollments: Enrollment[];
}

function EnrollEmployeePopover({ course, employees, enrollments }: EnrollEmployeePopoverProps) {
    const { companyId } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    // Filter out already enrolled employees
    const enrolledIds = enrollments
        .filter(e => e.courseId === course.id)
        .map(e => e.employeeId);
    const availableEmployees = employees.filter(e => !enrolledIds.includes(e.id));

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
                <Button variant="secondary" size="sm" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enroll Employee
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandList>
                        <CommandEmpty>
                            {availableEmployees.length === 0
                                ? "All employees enrolled"
                                : "No employees found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {availableEmployees.map((employee) => (
                                <CommandItem
                                    key={employee.id}
                                    onSelect={() => handleEnroll(employee.id)}
                                >
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={employee.avatar} />
                                        <AvatarFallback className="text-xs">
                                            {employee.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
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


interface CourseCardProps {
    course: TrainingCourse;
    employees: Employee[];
    enrollments: Enrollment[];
}

function CourseCard({ course, employees, enrollments }: CourseCardProps) {
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
    const completedCount = courseEnrollments.filter(e => e.status === 'Completed').length;
    const inProgressCount = courseEnrollments.filter(e => e.status === 'In Progress').length;
    const enrolledCount = courseEnrollments.filter(e => e.status === 'Enrolled').length;
    const totalEnrolled = courseEnrollments.length;
    const completionRate = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{course.title}</CardTitle>
                        <CardDescription className="mt-1">
                            <Badge variant="outline" className="text-xs">
                                {course.category || 'General'}
                            </Badge>
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                        <HelpCircle className="h-3 w-3" />
                        {course.questions?.length || 0}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration || 0}h
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {totalEnrolled} enrolled
                    </div>
                </div>

                {/* Progress */}
                {totalEnrolled > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-1.5" />
                        <div className="flex gap-2 mt-2 text-xs">
                            {completedCount > 0 && (
                                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3" />
                                    {completedCount}
                                </Badge>
                            )}
                            {inProgressCount > 0 && (
                                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                    <PlayCircle className="h-3 w-3" />
                                    {inProgressCount}
                                </Badge>
                            )}
                            {enrolledCount > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    <Users className="h-3 w-3" />
                                    {enrolledCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                    <EnrollEmployeePopover course={course} employees={employees} enrollments={enrollments} />
                </div>
            </CardContent>
        </Card>
    );
}

// Stats Overview
interface StatsOverviewProps {
    courses: TrainingCourse[];
    enrollments: Enrollment[];
    employees: Employee[];
}

function StatsOverview({ courses, enrollments, employees }: StatsOverviewProps) {
    const totalCourses = courses.length;
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.status === 'Completed').length;
    const overallCompletionRate = totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{totalCourses}</p>
                <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-xs text-muted-foreground">Enrollments</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <GraduationCap className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{completedEnrollments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{overallCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
        </div>
    );
}

interface TrainingCatalogTabProps {
    courses: TrainingCourse[];
    employees: Employee[];
}

export function TrainingCatalogTab({ courses, employees }: TrainingCatalogTabProps) {
    const { companyId } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

    // Load enrollments
    useEffect(() => {
        if (!companyId) return;

        const enrollmentsRef = ref(db, `companies/${companyId}/enrollments`);
        const unsubscribe = onValue(enrollmentsRef, (snapshot) => {
            const data = snapshot.val();
            const list: Enrollment[] = data ? Object.values(data) : [];
            setEnrollments(list);
        });

        return () => unsubscribe();
    }, [companyId]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Training Catalog
                    </CardTitle>
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
                {/* Stats Overview */}
                <StatsOverview courses={courses} enrollments={enrollments} employees={employees} />

                {/* Courses Grid */}
                {courses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                employees={employees}
                                enrollments={enrollments}
                            />
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
