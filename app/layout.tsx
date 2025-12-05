import React from "react";
import type { Metadata } from "next";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import {Navbar} from "@/components/Navbar"
import LightRays from "@/components/LightRays";

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
  title: "MentorLaunch",
  description: "Connect with expert mentors and accelerate your career",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable} antialiased relative`}
      >
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
        <div className="fixed inset-0 z-10 pointer-events-none opacity-70">
          <LightRays
            raysOrigin="top-center"
            raysColor="#8b5cf6"
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
        {children}
      </body>
    </html>
  );
}
