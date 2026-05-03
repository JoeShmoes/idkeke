import type {Metadata} from 'next';
import './globals.css';
import './yoopta-fallback.css';
import { Toaster } from "@/components/ui/toaster";
import AppProvider from '@/components/layout/app-provider';
import AppBody from '@/components/layout/app-body';
import { SyncManager } from '@/components/sync-manager';
import { ResetPasswordModal } from '@/components/auth/reset-password-modal';


export const metadata: Metadata = {
  title: 'Nexaris Module',
  description: 'Nexaris Module is an all-in-one productivity platform designed to streamline your business and personal life. Manage tasks, notes, journals, and workflows with state-of-the-art AI integration.',
  keywords: 'productivity, task management, second brain, AI assistant, business management, workflow automation, smart notes, journal app, productivity workspace',
  openGraph: {
    title: 'Nexaris Module | AI-Powered Productivity Platform',
    description: 'Transform your workflow with Nexaris Module. The smartest way to manage your tasks, notes, and business projects.',
    url: 'https://nexarismodule.online',
    siteName: 'Nexaris Module',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: { url: '/icon.png' },
    shortcut: { url: '/favicon.ico' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexaris Module',
  },
  // Google AdSense ownership verification
  other: {
    'google-adsense-account': 'ca-pub-9962241770739113',
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
        <meta name="referrer" content="origin-when-cross-origin" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        {/* Google AdSense - using plain script tag to avoid data-nscript attribute warning */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9962241770739113"
          crossOrigin="anonymous"
        />
      </head>
      <body>
            <AppProvider>
                <SyncManager />
                <ResetPasswordModal />
                <AppBody>
                    {children}
                </AppBody>
                <Toaster />
            </AppProvider>
      </body>
    </html>
  );
}
