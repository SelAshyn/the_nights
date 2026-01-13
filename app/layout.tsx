import React from "react";
import type { Metadata } from "next";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import {Navbar} from "@/components/Navbar"
import LightRays from "@/components/LightRays";
import { NetworkErrorBoundary } from "@/components/NetworkErrorBoundary";
import { AuthSync } from "@/components/AuthSync";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UNITE | Launch Your Future",
  description: "Connect with expert mentors and accelerate your career",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '2x2', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '6x6', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="32x32" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable} antialiased relative text-white`}
      >
        <div className="fixed inset-0 -z-10 bg-gradient-to-r from-gray-900 via-slate-900 to-teal-900" />
        <div className="fixed inset-0 z-10 pointer-events-none opacity-30">
          <LightRays
            raysOrigin="top-center"
            raysColor="#14b8a6"
            raysSpeed={0.5}
            lightSpread={3.0}
            rayLength={1.0}
            followMouse={true}
            mouseInfluence={0.2}
            noiseAmount={0.1}
            distortion={0.1}
            fadeDistance={0.6}
            saturation={1.0}
            pulsating={true}
          />
        </div>
        <AuthSync />
        <NetworkErrorBoundary>
          {children}
        </NetworkErrorBoundary>
      </body>
    </html>
  );
}
