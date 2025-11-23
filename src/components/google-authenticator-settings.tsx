
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// This is a placeholder for the actual 2FA logic.
// In a real application, you would use a library like 'speakeasy' and 'qrcode'
// to generate a secret and a QR code for the user to scan.

const fakeGenerate2FASecret = () => {
    return {
        secret: "FAKE_SECRET_FOR_UI_ONLY",
        qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // 1x1 black pixel
    };
};

export function GoogleAuthenticatorSettings() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [secret, setSecret] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const { toast } = useToast();

    const handleToggle2FA = async (enabled: boolean) => {
        if (enabled) {
            // In a real app, you'd call a server-side function to generate a secret
            const { secret, qrCodeUrl } = fakeGenerate2FASecret();
            setSecret(secret);
            setQrCodeUrl(qrCodeUrl);
            setIs2FAEnabled(true);
        } else {
            // Here you would call a server-side function to disable 2FA
            setIs2FAEnabled(false);
            setSecret(null);
            setQrCodeUrl(null);
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
            setQrCodeUrl(null); // Hide QR code after verification
        } else {
            toast({
                variant: "destructive",
                title: "Invalid Verification Code",
                description: "The code you entered is incorrect. Please try again.",
            });
        }
    };

    return (
        <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 mb-4">
                Secure your account with Google Authenticator.
            </p>
            <div className="flex items-center justify-between">
                <label htmlFor="2fa-switch" className="font-medium">
                    Enable Google Authenticator
                </label>
                <Switch
                    id="2fa-switch"
                    checked={is2FAEnabled}
                    onCheckedChange={handleToggle2FA}
                />
            </div>
            {is2FAEnabled && qrCodeUrl && (
                <div className="mt-4">
                    <p className="mb-2">1. Scan this QR code with your Google Authenticator app:</p>
                    <div className="flex justify-center my-4">
                        <img src={qrCodeUrl} alt="QR Code" />
                    </div>
                    <p className="mb-2">2. Enter the 6-digit code from your app to verify:</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Verification Code"
                        />
                        <Button onClick={handleVerifyCode}>Verify</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
