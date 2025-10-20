// src/app/docs/api/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ApiDocsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/">
                      <Logo />
                    </Link>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12">
                <div className="container max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">API Documentation</h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Integrate your existing systems with VerticalSync using our powerful and simple REST API.
                        </p>
                    </div>
                    
                    <div className="space-y-8">
                        <section id="authentication">
                            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
                            <p className="mb-4">All API requests must be authenticated using an API key. You can generate and manage your API key in the <Link href="/dashboard/settings" className="underline text-primary">API Settings</Link> page.</p>
                             <p>Include your API key in the `Authorization` header of your requests, prefixed with "Bearer".</p>
                            <pre className="mt-4 bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                <code>
                                    Authorization: Bearer YOUR_API_KEY
                                </code>
                            </pre>
                        </section>
                        
                        <Separator />

                        <section id="endpoints">
                            <h2 className="text-2xl font-semibold mb-4">Available Endpoints</h2>
                            <p className="mb-4 text-muted-foreground">The following endpoints are currently available. More endpoints will be added in the future.</p>
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span className="text-sm font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-md">GET</span>
                                            /api/v1/employees
                                        </CardTitle>
                                        <CardDescription>
                                            Retrieve a list of all employees in your company.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">POST</span>
                                            /api/v1/employees
                                        </CardTitle>
                                        <CardDescription>
                                            Create a new employee record.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
