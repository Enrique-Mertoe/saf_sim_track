import type {Metadata, Viewport} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import "./main.scss";
import {Toaster} from 'react-hot-toast';
import React from "react";
import {DialogProvider} from "@/app/_providers/dialog";
import {AlertDialog} from "@/ui/alert/AlertDialog";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | SIM Card Management System',
    default: 'SIM Card Management System | Safaricom Distributor Portal',
  },
  description: 'Track and manage SIM card sales, activations, and performance metrics across different sales teams with our comprehensive management system.',
  keywords: [
    'SIM card management',
    'Safaricom',
    'distributor portal',
    'sales tracking',
    'activation monitoring',
    'team performance',
    'quality metrics',
  ],
  authors: [
    { name: 'Safaricom Distributors' }
  ],
  creator: 'Safaricom Distribution Team',
  publisher: 'Safaricom',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sim-management-system.example.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/shortcut-icon.png'],
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://sim-management-system.example.com',
    title: 'SIM Card Management System | Safaricom Distributor Portal',
    description: 'A comprehensive system for tracking SIM card sales, activations, and team performance metrics for Safaricom distributors.',
    siteName: 'SIM Card Management System',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SIM Card Management System Dashboard Preview',
      },
    ],
  },
  manifest: '/manifest.json',
  category: 'business',
  applicationName: 'Safaricom SIM Card Management System',
  verification: {
    // Add verification tokens if needed
    // google: 'verification_token',
    // yandex: 'verification_token',
  },
  appleWebApp: {
    capable: true,
    title: 'SIM Card Management System',
    statusBarStyle: 'black-translucent',
  },
  robots: {
    index: false,
    follow: false,
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
  ],
};
export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            suppressHydrationWarning
        >
        {/*<UserManagerInitProvider/>*/}
        {/*<SupabaseProvider>*/}
            <DialogProvider>
                {/*<DialogStyles/>*/}
                {children}
            </DialogProvider>
            <Toaster position="bottom-center"/>
        <AlertDialog/>

        {/*</SupabaseProvider>*/}
        </body>
        </html>
    );
}
