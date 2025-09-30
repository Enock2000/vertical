
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Check, Clock } from 'lucide-react';
import type { Enrollment, TrainingCourse } from '@/lib/data';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


interface TrainingsTabProps {
  enrollments: Enrollment[];
  courses: TrainingCourse[];
}

export function TrainingsTab({ enrollments, courses }: TrainingsTabProps) {
  
  const enrichedEnrollments = enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      return {
          ...enrollment,
          courseTitle: course?.title || 'Unknown Course',
          courseDescription: course?.description || 'No description available.',
      }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assigned Trainings</CardTitle>
        <CardDescription>
          Complete these modules as assigned by your manager.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {enrichedEnrollments.length > 0 ? (
            <div className="space-y-4">
              {enrichedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className='flex-1'>
                      <h3 className="font-semibold">{enrollment.courseTitle}</h3>
                       <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                        {enrollment.courseDescription}
                       </p>
                    </div>
                     <div className="ml-4 flex flex-col items-end gap-2">
                        {enrollment.status === 'Completed' ? (
                            <Button variant="secondary" disabled>
                                <Check className="mr-2 h-4 w-4" />
                                Completed
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href={`/trainings/${enrollment.courseId}`}>
                                    Start Training
                                </Link>
                            </Button>
                        )}
                        {enrollment.score !== undefined && (
                            <Badge variant={enrollment.score >= 80 ? "default" : "destructive"}>
                                Score: {enrollment.score}%
                            </Badge>
                        )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center">
                    {enrollment.status === 'Completed' ? <Check className="h-3 w-3 mr-1 text-green-500"/> : <Clock className="h-3 w-3 mr-1"/>}
                    Status: {enrollment.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">You have no assigned trainings.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
