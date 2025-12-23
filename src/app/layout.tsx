import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppProvider from '@/components/layout/app-provider';
import AppBody from '@/components/layout/app-body';


export const metadata: Metadata = {
  title: 'Nexaris Module',
  description: 'Manage your business and personal life with AI.',
  icons: {
    icon: [
      { url: '/sidebar-logo-favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: { url: '/extension/icons/icon128.png' },
    shortcut: { url: '/extension/icons/icon128.png' },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
            <AppProvider>
                <AppBody>
                    {children}
                </AppBody>
            </AppProvider>
        <Toaster />
        <link rel="icon" href="/sidebar-logo-favicon.svg" type="image/svg+xml" />
      </body>
    </html>
  );
}
