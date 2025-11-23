
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

// In a real app, this function would be replaced by a secure, server-side API endpoint
// that generates a unique secret for the user using a library like `speakeasy` or `otplib`.
const fakeGenerate2FASecret = () => {
    // NOTE: This is placeholder data for UI demonstration purposes only.
    // A real implementation MUST generate a unique, secure secret on the backend.
    const secret = "SECRET_MUST_BE_GENERATED_ON_BACKEND";
    const userEmail = "user@example.com"; // This should be the actual user's email
    const issuer = "VerticalSync";
    const otpauth_url = `otpauth://totp/${issuer}:${userEmail}?secret=${secret}&issuer=${issuer}`;
    
    return {
        secret,
        otpauth_url,
    };
};

export function GoogleAuthenticatorSettings() {
    const { employee } = useAuth();
    const [is2FAEnabled, setIs2FAEnabled] = useState(!!employee?.isTwoFactorEnabled);
    const [isVerified, setIsVerified] = useState(!!employee?.isTwoFactorEnabled);
    const [secret, setSecret] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (secret) {
            const { otpauth_url } = fakeGenerate2FASecret();
            QRCode.toDataURL(otpauth_url, (err, url) => {
                if (err) {
                    console.error(err);
                    toast({
                        variant: "destructive",
                        title: "QR Code Error",
                        description: "Could not generate QR code.",
                    });
                } else {
                    setQrCodeUrl(url);
                }
            });
        }
    }, [secret, toast]);

    const handleToggle2FA = async (enabled: boolean) => {
        if (!employee) return;

        setIs2FAEnabled(enabled);
        if (enabled) {
            // In a real app, you would call your backend here to generate and get the user's secret.
            const { secret } = fakeGenerate2FASecret();
            setSecret(secret);
            setIsVerified(false); // Require verification for new setup
        } else {
            // Disable 2FA
            await update(ref(db, `employees/${employee.id}`), { isTwoFactorEnabled: false });
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

    const handleVerifyCode = async () => {
        if (!employee) return;

        // In a real app, this code would be sent to your backend for verification against the user's secret.
        // The backend would use a library like `speakeasy` or `otplib` to check if the code is valid.
        // For this UI demonstration, we accept any 6-digit code.
        if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) { 
            await update(ref(db, `employees/${employee.id}`), { isTwoFactorEnabled: true });
            toast({
                title: "Two-Factor Authentication Enabled",
                description: "Google Authenticator has been successfully enabled for your account.",
            });
            setIsVerified(true);
        } else {
            toast({
                variant: "destructive",
                title: "Invalid Verification Code",
                description: "Please enter a valid 6-digit code.",
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
                    <div className="flex justify-center my-4 bg-white p-4 rounded-lg w-fit mx-auto">
                        {qrCodeUrl ? (
                            <Image 
                                src={qrCodeUrl} 
                                alt="QR Code" 
                                width={150} 
                                height={150} 
                            />
                        ) : (
                            <div className="h-[150px] w-[150px] bg-gray-200 animate-pulse rounded-md" />
                        )}
                    </div>
                    <p className="text-sm">2. Enter the 6-digit code from your app to verify:</p>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
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
