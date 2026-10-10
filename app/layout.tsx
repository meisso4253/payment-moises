import type { Metadata } from "next";
import "./globals.css";
import "../lib/theme.css";
import { themeScript } from "../lib/theme-document";

export const metadata: Metadata = {
  title: "StudyTrack",
  description: "Make room for your student life. Organize deadlines, plan your week, and find your focus with StudyTrack.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg?v=studytrack-book-1",
    shortcut: "/favicon.svg?v=studytrack-book-1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
