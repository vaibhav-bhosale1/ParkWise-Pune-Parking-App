// src/app/layout.js (Updated)

import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ParkWise",
  description: "AI-Powered Parking Assistant for Pune",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>{children}
        <Toaster position="top-left" richColors/>
      </body>

    </html>
  );
}