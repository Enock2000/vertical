// src/components/logo.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface LogoProps {
    companyName?: string | null;
    logoUrl?: string | null;
}

export default function Logo({ companyName, logoUrl }: LogoProps) {
  const [platformLogoUrl, setPlatformLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch the platform logo if no specific company logo is provided
    if (logoUrl === undefined) {
      const platformSettingsRef = ref(db, 'platformSettings/mainLogoUrl');
      const unsubscribe = onValue(platformSettingsRef, (snapshot) => {
        setPlatformLogoUrl(snapshot.val());
      });
      return () => unsubscribe();
    }
  }, [logoUrl]);
  
  const finalLogoUrl = logoUrl === undefined ? platformLogoUrl : logoUrl;
  const finalCompanyName = companyName === undefined ? 'VerticalSync' : companyName;

  return (
    <div className="flex items-center gap-2">
       <div className="flex items-center justify-center size-8">
            {finalLogoUrl ? (
                 <Image src={finalLogoUrl} alt={finalCompanyName || 'Company Logo'} width={32} height={32} className="rounded-sm object-contain" />
            ) : null}
       </div>
       <span className="text-xl font-bold text-foreground">{finalCompanyName || 'VerticalSync'}</span>
    </div>
  );
}
