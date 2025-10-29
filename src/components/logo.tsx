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
  const finalCompanyName = companyName === undefined ? 'PayTrack' : companyName;

  return (
    <div className="flex items-center gap-2">
       <div className="flex items-center justify-center size-8">
            {finalLogoUrl ? (
                 <Image src={finalLogoUrl} alt={finalCompanyName || 'Company Logo'} width={32} height={32} className="rounded-sm object-contain" />
            ) : (
                <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-full"
                >
                    <rect width="100" height="100" fill="black" />
                    <g transform="translate(0, 5)">
                        <path d="M50 0 L100 50 L75 50 L75 100 L25 100 L25 50 L0 50 Z" fill="hsl(var(--foreground))" />
                        <circle cx="75" cy="20" r="15" fill="hsl(var(--primary))" />
                        <text
                            x="50"
                            y="50"
                            transform="rotate(90, 50, 50)"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="hsl(var(--primary))"
                            fontSize="14"
                            fontWeight="bold"
                        >
                            <tspan x="50" dy="-0.6em">PAY</tspan>
                            <tspan x="50" dy="1.2em">TRACK</tspan>
                        </text>
                    </g>
                </svg>
            )}
       </div>
       <span className="text-xl font-bold text-foreground">{finalCompanyName || 'PayTrack'}</span>
    </div>
  );
}
