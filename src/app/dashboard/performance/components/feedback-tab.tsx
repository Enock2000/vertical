'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FeedbackTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>360-Degree Feedback</CardTitle>
        <CardDescription>
          Collect and review comprehensive feedback from peers and managers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">360-degree feedback features coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
