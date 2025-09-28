'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PerformanceReviewsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Reviews</CardTitle>
        <CardDescription>
          Manage employee performance reviews and track goals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Performance review features coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
