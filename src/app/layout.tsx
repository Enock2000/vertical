
'use client';

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupportChat } from '@/components/support-chat';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from './auth-provider';
import { useEffect } from 'react';
import type { ThemeSettings } from '@/lib/data';

const AppBody = ({ children }: { children: React.ReactNode }) => {
    const { employee } = useAuth();

    useEffect(() => {
        const root = document.documentElement;
        if (employee?.themeSettings) {
            const { background, primary, accent } = employee.themeSettings;
            root.style.setProperty('--background', `${background.h} ${background.s}% ${background.l}%`);
            root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
            root.style.setProperty('--accent', `${accent.h} ${accent.s}% ${accent.l}%`);
        } else {
            // Clear styles if no settings are found to revert to CSS defaults
            root.style.removeProperty('--background');
            root.style.removeProperty('--primary');
            root.style.removeProperty('--accent');
        }
    }, [employee]);

    return (
        <>
            {children}
            <Toaster />
            <SupportChat />
        </>
    )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>VerticalSync</title>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
          <AuthProvider>
            <AppBody>
                {children}
            </AppBody>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
