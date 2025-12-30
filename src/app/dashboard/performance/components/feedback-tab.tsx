'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PlusCircle,
    MessageSquare,
    Users,
    TrendingUp,
    Calendar,
    Star,
    Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Employee, Feedback } from '@/lib/data';
import { RequestFeedbackDialog } from './request-feedback-dialog';

interface FeedbackItemProps {
    feedback: Feedback;
}

function FeedbackItem({ feedback }: FeedbackItemProps) {
    const provider = feedback.isAnonymous ? 'Anonymous' : feedback.providerEmployeeName;
    const date = format(new Date(feedback.feedbackDate), 'MMM d, yyyy');

    return (
        <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    feedback.isAnonymous ? "bg-gray-100" : "bg-primary/10"
                )}>
                    {feedback.isAnonymous ? (
                        <Users className="h-5 w-5 text-gray-500" />
                    ) : (
                        <span className="text-sm font-semibold text-primary">
                            {provider.split(' ').map(n => n[0]).join('')}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{provider}</span>
                        <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                    <div className="relative">
                        <Quote className="absolute -top-1 -left-1 h-4 w-4 text-muted-foreground/30" />
                        <p className="text-sm pl-4 text-muted-foreground">{feedback.content}</p>
                    </div>
                    {feedback.prompt && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            <span className="font-medium">In response to: </span>
                            {feedback.prompt}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface FeedbackStatsProps {
    feedbackCount: number;
    anonymousCount: number;
    lastFeedbackDate: string | null;
}

function FeedbackStats({ feedbackCount, anonymousCount, lastFeedbackDate }: FeedbackStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{feedbackCount}</p>
                <p className="text-xs text-muted-foreground">Total Feedback</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{anonymousCount}</p>
                <p className="text-xs text-muted-foreground">Anonymous</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-lg font-bold">{lastFeedbackDate || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Last Feedback</p>
            </div>
        </div>
    );
}

interface FeedbackTabProps {
    employees: Employee[];
    allFeedback: Feedback[];
}

export function FeedbackTab({ employees, allFeedback }: FeedbackTabProps) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
        employees.length > 0 ? employees[0].id : null
    );

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId) || null;
    }, [selectedEmployeeId, employees]);

    const employeeFeedback = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return allFeedback
            .filter(f => f.subjectEmployeeId === selectedEmployeeId)
            .sort((a, b) => new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime());
    }, [selectedEmployeeId, allFeedback]);

    const feedbackStats = useMemo(() => {
        const anonymousCount = employeeFeedback.filter(f => f.isAnonymous).length;
        const lastFeedback = employeeFeedback[0] ? format(new Date(employeeFeedback[0].feedbackDate), 'MMM d') : null;
        return {
            feedbackCount: employeeFeedback.length,
            anonymousCount,
            lastFeedbackDate: lastFeedback
        };
    }, [employeeFeedback]);

    // Get feedback given by this employee to others
    const feedbackGiven = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return allFeedback
            .filter(f => f.providerEmployeeId === selectedEmployeeId)
            .sort((a, b) => new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime());
    }, [selectedEmployeeId, allFeedback]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            360-Degree Feedback
                        </CardTitle>
                        <CardDescription>
                            Collect and review comprehensive feedback from peers and managers.
                        </CardDescription>
                    </div>
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
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Employee Selector */}
                <div className="flex items-center gap-4">
                    <Select value={selectedEmployeeId || undefined} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={employee.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {employee.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{employee.name}</span>
                                        <Badge variant="outline" className="ml-auto text-xs">
                                            {employee.role}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedEmployee && (
                    <>
                        {/* Stats */}
                        <FeedbackStats {...feedbackStats} />

                        {/* Feedback Tabs */}
                        <Tabs defaultValue="received" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="received" className="gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Received ({employeeFeedback.length})
                                </TabsTrigger>
                                <TabsTrigger value="given" className="gap-2">
                                    <Star className="h-4 w-4" />
                                    Given ({feedbackGiven.length})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="received" className="mt-4">
                                {employeeFeedback.length > 0 ? (
                                    <div className="space-y-3">
                                        {employeeFeedback.map(fb => (
                                            <FeedbackItem key={fb.id} feedback={fb} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-center">
                                        <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No feedback received yet.</p>
                                        <p className="text-sm text-muted-foreground">Click "Request Feedback" to get started.</p>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="given" className="mt-4">
                                {feedbackGiven.length > 0 ? (
                                    <div className="space-y-3">
                                        {feedbackGiven.map(fb => {
                                            const recipient = employees.find(e => e.id === fb.subjectEmployeeId);
                                            return (
                                                <div key={fb.id} className="border rounded-lg p-4 bg-card">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm text-muted-foreground">To:</span>
                                                        <span className="font-medium text-sm">{recipient?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {format(new Date(fb.feedbackDate), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{fb.content}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-center">
                                        <Star className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No feedback given yet.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {!selectedEmployee && employees.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <Users className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No employees found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
