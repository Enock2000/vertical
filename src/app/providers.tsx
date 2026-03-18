'use client';

import { Toaster } from "@/components/ui/toaster";
import { SupportChat } from '@/components/support-chat';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from './auth-provider';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

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
      root.style.removeProperty('--background');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
    }
  }, [employee]);

  useEffect(() => {
    const logoUrlRef = ref(db, 'platformSettings/mainLogoUrl');
    const unsubscribe = onValue(logoUrlRef, (snapshot) => {
      const logoUrl = snapshot.val();
      if (logoUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = logoUrl;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {children}
      <Toaster />
      <SupportChat />
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
