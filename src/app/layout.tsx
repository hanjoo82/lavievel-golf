import type { Metadata } from 'next';
import '@/styles/globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'La Vie Belle Golf Club',
  description: '라비에벨 컨트리클럽 골프 모임 관리 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LVB Golf',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LVB Golf" />
        <meta name="theme-color" content="#8B5C5C" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <Navigation />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
