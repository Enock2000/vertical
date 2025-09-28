'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrainingCatalogTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Catalog</CardTitle>
        <CardDescription>
          Browse and manage available training courses for employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Training catalog features coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
