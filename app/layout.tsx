import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatbotButton from "@/components/ChatbotButton";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriBridge - Digital Marketplace for Farmers",
  description: "Connecting farmers directly with buyers, retailers, and consumers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgriBridge",
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AgriBridge',
    'application-name': 'AgriBridge',
    'msapplication-TileColor': '#16a34a',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
          <ChatbotButton />
          <PWAInstallPrompt />
        </I18nProvider>
      </body>
    </html>
  );
}