import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studyloop — LeetCode practice that sticks",
  description: "Track solved problems, spot weak patterns, and review on a deterministic spaced repetition schedule.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
