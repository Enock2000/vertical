'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare } from 'lucide-react';
import type { Employee, Feedback } from '@/lib/data';
import { RequestFeedbackDialog } from './request-feedback-dialog';

interface FeedbackItemProps {
    feedback: Feedback;
}

function FeedbackItem({ feedback }: FeedbackItemProps) {
    const provider = feedback.isAnonymous ? 'Anonymous' : feedback.providerEmployeeName;
    const date = new Date(feedback.feedbackDate).toLocaleDateString();

    return (
        <div className="border p-4 rounded-md bg-muted/50">
            <p className="text-sm">{feedback.content}</p>
            <p className="text-xs text-muted-foreground mt-2">
                From: <strong>{provider}</strong> on {date}
            </p>
            {feedback.prompt && (
                 <p className="text-xs text-muted-foreground mt-2 italic">
                    In response to: "{feedback.prompt}"
                </p>
            )}
        </div>
    );
}

interface FeedbackTabProps {
    employees: Employee[];
    allFeedback: Feedback[];
}

export function FeedbackTab({ employees, allFeedback }: FeedbackTabProps) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId) || null;
    }, [selectedEmployeeId, employees]);

    const employeeFeedback = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return allFeedback
            .filter(f => f.subjectEmployeeId === selectedEmployeeId)
            .sort((a, b) => new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime());
    }, [selectedEmployeeId, allFeedback]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>360-Degree Feedback</CardTitle>
                <CardDescription>
                    Collect and review comprehensive feedback from peers and managers.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Select onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select an employee to view feedback" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedEmployee && (
                         <RequestFeedbackDialog 
                            subjectEmployee={selectedEmployee} 
                            employees={employees.filter(e => e.id !== selectedEmployee.id)}
                         >
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Request Feedback
                            </Button>
                        </RequestFeedbackDialog>
                    )}
                </div>

                {selectedEmployeeId ? (
                    employeeFeedback.length > 0 ? (
                        <div className="space-y-4">
                            {employeeFeedback.map(fb => (
                                <FeedbackItem key={fb.id} feedback={fb} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No feedback found for {selectedEmployee?.name}.</p>
                            <p className="text-sm text-muted-foreground">Click "Request Feedback" to get started.</p>
                        </div>
                    )
                ) : (
                     <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Please select an employee to view their feedback.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
