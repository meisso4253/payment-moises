import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import "./globals.css";
import "../lib/theme.css";
import "../lib/pwa.css";
import { themeScript } from "../lib/theme-document";

export const metadata: Metadata = {
  title: "StudyTrack",
  description: "Make room for your student life. Organize deadlines, plan your week, and find your focus with StudyTrack.",
  applicationName: 'StudyTrack',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'StudyTrack', statusBarStyle: 'default' },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg?v=studytrack-book-1",
    shortcut: "/favicon.svg?v=studytrack-book-1",
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#6751d3' }, { media: '(prefers-color-scheme: dark)', color: '#121416' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="antialiased">{children}<Script src="/pwa.js" strategy="afterInteractive" /></body>
    </html>
  );
}
