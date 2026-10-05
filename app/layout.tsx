import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolveLoop — Log, learn, re-solve",
  description: "A private LeetCode problem log with pattern analytics and automatic spaced re-solving for difficult problems.",
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
