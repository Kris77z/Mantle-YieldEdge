import type { Metadata } from "next";
import { Playfair_Display, Urbanist } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamically import Providers to avoid SSR issues with WalletConnect/indexedDB
const Providers = dynamic(() => import("./providers").then(mod => ({ default: mod.Providers })), {
  ssr: false,
});

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist" });

export const metadata: Metadata = {
  title: "Mantle YieldEdge - Zero-Loss Prediction Market",
  description: "Bet with your yield, not your principal. A revolutionary RWA prediction market on Mantle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        playfair.variable,
        urbanist.variable,
        "font-sans antialiased bg-[#E1D9CB] text-[#302A30]"
      )}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
