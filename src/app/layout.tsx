import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maybern-Inspired Fund Intelligence",
  description: "Private markets operations platform built with Next.js + Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
