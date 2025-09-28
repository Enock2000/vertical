'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CertificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
        <CardDescription>
          Track employee certifications and their expiry dates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Certification tracking features coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
