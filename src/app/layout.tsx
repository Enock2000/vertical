import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Vertical Sync | Global HR System & People Platform',
  description: 'Scale globally with velocity and ease. VerticalSync is an AI-powered HR platform for automated payroll, compliance, recruitment, and employee self-service.',
  keywords: ['Vertical Sync', 'HR System', 'Payroll Software', 'Global HR', 'Employee Portal', 'Human Resources', 'Compliance Management', 'Recruitment Platform'],
  authors: [{ name: 'Oran Investment' }],
  creator: 'Vertical Sync',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vshr.oraninvestments.com/',
    title: 'Vertical Sync | Global HR System',
    description: 'Scale globally with velocity and ease. The complete HR solution.',
    siteName: 'Vertical Sync',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vertical Sync | Global HR System',
    description: 'Scale globally with velocity and ease. The complete HR solution.',
  },
};

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
        {/* Lenco Pay SDK for card/mobile money payments */}
        <script src="https://pay.lenco.co/js/v1/inline.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.LencoPayClass) {
                window.LencoPay = new window.LencoPayClass();
              }
            `,
          }}
        />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Vertical Sync",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "An AI-powered global HR system and people platform streamlining payroll, recruitment, compliance, and employee management.",
              "producer": {
                "@type": "Organization",
                "name": "Oran Investment"
              }
            }),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
