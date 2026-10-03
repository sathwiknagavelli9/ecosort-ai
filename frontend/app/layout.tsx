import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EcoSort AI — Scan. Sort. Recycle Smarter.",
    template: "%s | EcoSort AI",
  },
  description:
    "Classify waste as cardboard, glass, metal, paper, plastic, or trash with a real MobileNetV2 model and receive responsible disposal guidance.",
  applicationName: "EcoSort AI",
  keywords: [
    "waste classification",
    "deep learning",
    "MobileNetV2",
    "TrashNet",
    "recycling",
  ],
  authors: [{ name: "EcoSort AI academic project" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "EcoSort AI",
    title: "EcoSort AI — Scan. Sort. Recycle Smarter.",
    description:
      "Real six-class waste image inference with careful recycling and disposal guidance.",
  },
  twitter: {
    card: "summary",
    title: "EcoSort AI",
    description: "Scan. Sort. Recycle Smarter.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d2d27",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}

