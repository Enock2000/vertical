"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import QRCode from "qrcode";

// This is a placeholder. In a real app, this would be a call to a secure backend endpoint.
const fakeGenerate2FASecret = () => {
    return {
        secret: "JBSWY3DPEHPK3PXP", // Example Base32 secret for demonstration
        otpauth_url: "otpauth://totp/VerticalSync:demo@example.com?secret=JBSWY3DPEHPK3PXP&issuer=VerticalSync"
    };
};

export function GoogleAuthenticatorSettings() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
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

    const handleToggle2FA = (enabled: boolean) => {
        setIs2FAEnabled(enabled);
        if (enabled) {
            const { secret } = fakeGenerate2FASecret();
            setSecret(secret);
            setIsVerified(false);
        } else {
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
        // This is a placeholder verification. In a real app, you'd verify this on the backend.
        if (verificationCode === "123456") { 
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
