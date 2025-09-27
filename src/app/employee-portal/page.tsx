'use client';

import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";


export default function EmployeePortalPage() {
    const [user, loading] = useAuthState(auth);
    
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="mx-auto w-full max-w-sm text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You must be logged in to view this page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/employee-login" className="text-primary underline">
                            Go to login
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Logo />
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to Your Portal, {user.displayName || user.email}</CardTitle>
                            <CardDescription>
                               This is your personal space to view your details and manage your information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>More features coming soon!</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

    