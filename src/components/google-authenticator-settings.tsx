"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

// This is a placeholder for the actual 2FA logic.
// In a real application, you would use a library like 'speakeasy' and 'qrcode'
// to generate a secret and a QR code for the user to scan.

const fakeGenerate2FASecret = () => {
    return {
        secret: "FAKE_SECRET_FOR_UI_ONLY",
        qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAAB3RJTUUH6AoGChYwYh55VAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAOSURBVDjLY2AYBaNgFIxIAABAAAABABwA+lAAAAAASUVORK5CYII=" // Fake QR code
    };
};

export function GoogleAuthenticatorSettings() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [secret, setSecret] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const { toast } = useToast();

    const handleToggle2FA = async (enabled: boolean) => {
        setIs2FAEnabled(enabled);
        if (enabled) {
            // In a real app, you'd call a server-side function to generate a secret
            const { secret, qrCodeUrl } = fakeGenerate2FASecret();
            setSecret(secret);
            setQrCodeUrl(qrCodeUrl);
            setIsVerified(false); // Reset verification status when re-enabling
        } else {
            // Here you would call a server-side function to disable 2FA
            setIsVerified(false);
            setSecret(null);
            setQrCodeUrl(null);
            setVerificationCode('');
            toast({
                title: "Two-Factor Authentication Disabled",
                description: "Google Authenticator has been disabled for your account.",
            });
        }
    };

    const handleVerifyCode = () => {
        // In a real app, you'd verify the code on the server
        if (verificationCode === "123456") { // Fake verification
            toast({
                title: "Two-Factor Authentication Enabled",
                description: "Google Authenticator has been successfully enabled for your account.",
            });
            setIsVerified(true);
        } else {
            toast({
                variant: "destructive",
                title: "Invalid Verification Code",
                description: "The code you entered is incorrect. Please try again.",
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <label htmlFor="2fa-switch" className="font-medium pr-4">
                    Enable Google Authenticator
                </label>
                <Switch
                    id="2fa-switch"
                    checked={is2FAEnabled}
                    onCheckedChange={handleToggle2FA}
                />
            </div>
            {is2FAEnabled && !isVerified && (
                <div className="mt-4 p-4 border rounded-lg space-y-4">
                    <p className="text-sm">1. Scan this QR code with your Google Authenticator app:</p>
                    <div className="flex justify-center my-4">
                        {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={128} height={128} />}
                    </div>
                    <p className="text-sm">2. Enter the 6-digit code from your app to verify:</p>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Verification Code"
                            maxLength={6}
                        />
                        <Button onClick={handleVerifyCode}>Verify</Button>
                    </div>
                </div>
            )}
             {is2FAEnabled && isVerified && (
                <div className="mt-4 p-4 border rounded-lg text-sm flex items-center gap-2 text-green-600 bg-green-50">
                    <CheckCircle className="h-5 w-5" />
                    <p>Two-factor authentication is enabled and verified.</p>
                </div>
            )}
        </div>
    );
}
