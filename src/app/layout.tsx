import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "CLARIFAKE | Know what's real.",
  description: "AI-powered content authenticity platform.",
};

import { ConditionalLayoutElements } from "@/components/layout/ConditionalLayoutElements";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-accent/30 selection:text-white`}
      >
        <ConditionalLayoutElements>
          {children}
        </ConditionalLayoutElements>
      </body>
    </html>
  );
}
