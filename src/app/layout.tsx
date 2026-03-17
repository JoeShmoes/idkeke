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
  description: 'Manage your business and personal life with AI.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: { url: '/icon.png' },
    shortcut: { url: '/favicon.ico' },
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
            <AppProvider>
                <SyncManager />
                <ResetPasswordModal />
                <AppBody>
                    {children}
                </AppBody>
            </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
