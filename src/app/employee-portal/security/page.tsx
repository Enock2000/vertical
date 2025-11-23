
// src/app/employee-portal/security/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function Enable2FADialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    // In a real implementation, you would get these from a server-side flow.
    const secretKey = "XXYYZZ1234567890"; 
    const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/VerticalSync:user@example.com?secret=XXYYZZ1234567890&issuer=VerticalSync";

    const handleCopy = () => {
        navigator.clipboard.writeText(secretKey);
        toast({ title: "Secret Key Copied" });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                        Scan the QR code with your authenticator app (e.g., Google Authenticator) or manually enter the secret key.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="p-4 bg-white rounded-md">
                        <img src={qrCodeUrl} alt="QR Code for 2FA" />
                    </div>
                    <p className="text-sm text-muted-foreground">Or enter this key manually:</p>
                     <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input type="text" value={secretKey} readOnly />
                        <Button type="button" variant="outline" onClick={handleCopy}>Copy</Button>
                    </div>
                </div>
                 <DialogFooter>
                    <p className="text-xs text-muted-foreground">
                        After scanning, enter the code from your app to verify and complete setup. This part would require a server-side flow.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function SecurityPage() {
    const { user } = useAuth();
    const [is2FAEnabled, setIs2FAEnabled] = useState(false); // This would come from user profile
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // This is a placeholder. In a real app, you'd call a flow to disable 2FA.
    const handleDisable2FA = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIs2FAEnabled(false);
            setIsLoading(false);
            toast({ title: '2FA Disabled', description: 'Two-factor authentication has been turned off for your account.' });
        }, 1000);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your password and two-factor authentication settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5"/>
                            Two-Factor Authentication (2FA)
                        </CardTitle>
                        <CardDescription>
                             Add an extra layer of security to your account by requiring a one-time code from your authenticator app to log in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {is2FAEnabled ? (
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                                <div>
                                    <p className="font-semibold text-green-800">2FA is Enabled</p>
                                    <p className="text-sm text-green-700">Your account is protected.</p>
                                </div>
                                <Button variant="destructive" onClick={handleDisable2FA} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Disable
                                </Button>
                            </div>
                        ) : (
                             <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-md">
                                <div>
                                    <p className="font-semibold text-amber-800">2FA is Disabled</p>
                                    <p className="text-sm text-amber-700">Your account is less secure.</p>
                                </div>
                                <Enable2FADialog>
                                    <Button disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Enable
                                    </Button>
                                </Enable2FADialog>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}
