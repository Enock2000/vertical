
// src/app/employee-portal/security/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthenticatorSettings } from '@/components/google-authenticator-settings';

export default function SecurityPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your password and two-factor authentication settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-md">
                    <GoogleAuthenticatorSettings />
                </div>
            </CardContent>
        </Card>
    )
}
