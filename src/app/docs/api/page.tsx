// src/app/docs/api/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ApiDocsPage() {
    const getEmployeesExample = `
[
  {
    "id": "emp_12345",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "Software Engineer",
    "status": "Active",
    "departmentName": "Technology"
  },
  {
    "id": "emp_67890",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "Product Manager",
    "status": "Active",
    "departmentName": "Product"
  }
]`;

    const postEmployeeExample = `
{
  "name": "Richard Hendricks",
  "email": "richard.h@example.com",
  "role": "Software Engineer",
  "departmentId": "dept_abcde",
  "salary": 85000,
  "workerType": "Salaried"
}`;


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
                            <p className="mb-4">All API requests must be authenticated using an API key. You can generate and manage your API key in the <Link href="/dashboard/settings?tab=api" className="underline text-primary">API Settings</Link> page.</p>
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
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span className="text-sm font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-md dark:bg-green-900 dark:text-green-200">GET</span>
                                            /api/v1/employees
                                        </CardTitle>
                                        <CardDescription>
                                            Retrieve a list of all employees in your company.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <h4 className="font-semibold mb-2">Example Request</h4>
                                        <pre className="mt-2 bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                            <code>
                                                {`curl -X GET 'https://your-app-domain.com/api/v1/employees' \\\n-H 'Authorization: Bearer YOUR_API_KEY'`}
                                            </code>
                                        </pre>
                                        <h4 className="font-semibold mt-4 mb-2">Example Response (200 OK)</h4>
                                        <pre className="mt-2 bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                            <code>
                                                {getEmployeesExample}
                                            </code>
                                        </pre>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md dark:bg-blue-900 dark:text-blue-200">POST</span>
                                            /api/v1/employees
                                        </CardTitle>
                                        <CardDescription>
                                            Create a new employee record. Note: This does not create a login account.
                                        </CardDescription>
                                    </CardHeader>
                                     <CardContent>
                                         <h4 className="font-semibold mb-2">Request Body</h4>
                                         <ul className="list-disc list-inside text-sm space-y-1">
                                             <li><code className="bg-muted px-1 rounded-sm">name</code> (string, required) - Full name of the employee.</li>
                                             <li><code className="bg-muted px-1 rounded-sm">email</code> (string, required) - Unique email address.</li>
                                             <li><code className="bg-muted px-1 rounded-sm">role</code> (string, required) - Job title or role.</li>
                                             <li><code className="bg-muted px-1 rounded-sm">departmentId</code> (string, required) - ID of the department.</li>
                                             <li><code className="bg-muted px-1 rounded-sm">salary</code> (number, required) - Annual salary or contract amount.</li>
                                             <li><code className="bg-muted px-1 rounded-sm">workerType</code> (string, required) - Must be 'Salaried', 'Hourly', or 'Contractor'.</li>
                                         </ul>
                                        <h4 className="font-semibold mt-4 mb-2">Example Request</h4>
                                        <pre className="mt-2 bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                            <code>
                                                {`curl -X POST 'https://your-app-domain.com/api/v1/employees' \\\n-H 'Authorization: Bearer YOUR_API_KEY' \\\n-H 'Content-Type: application/json' \\\n-d '${postEmployeeExample}'`}
                                            </code>
                                        </pre>
                                        <h4 className="font-semibold mt-4 mb-2">Example Response (201 Created)</h4>
                                        <pre className="mt-2 bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                            <code>
                                                {`{\n  "success": true,\n  "message": "Employee created successfully.",\n  "employeeId": "new_emp_id_12345"\n}`}
                                            </code>
                                        </pre>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
