'use client';

import React, { useState } from 'react';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { VaultsTable } from '@/components/vaults/VaultsTable';
import { AccountSummary } from '@/components/vaults/AccountSummary';
import { MarketsView } from '@/components/markets/MarketsView';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { SpiritualHero } from '@/components/landing/SpiritualHero';

import Image from 'next/image';

export default function Home() {
  const [activeView, setActiveView] = useState<'earn' | 'markets'>('earn');

  return (
    <main className="min-h-screen bg-[var(--background)] font-sans selection:bg-[#E1D9CB] pb-20 overflow-x-hidden text-[var(--foreground)] relative">
      {/* GLOBAL TEXTURE OVERLAY */}
      <div className="fixed inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none">
        <Image
          src="/images/bg.05d39a97.png"
          fill
          alt="Texture"
          className="object-cover opacity-60"
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(225,217,203,0.8)] backdrop-blur-md">
        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex flex-col">
                <span className="font-serif font-medium text-2xl tracking-normal text-[var(--foreground)]">
                  YieldEdge
                </span>
                <span className="text-[10px] text-[var(--muted)] tracking-[0.25em] font-sans uppercase translate-y-[-2px]">
                  Mantle Markets
                </span>
              </div>
            </div>

            {/* Main Navigation - Pill Toggle */}
            <nav className="hidden md:flex items-center gap-1 bg-[#dcd4c7] p-1.5 rounded-full">
              <button
                onClick={() => setActiveView('earn')}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  activeView === 'earn'
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[rgba(148,116,147,0.25)]"
                    : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.3)]"
                )}
              >
                Earn
              </button>
              <button
                onClick={() => setActiveView('markets')}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  activeView === 'markets'
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[rgba(148,116,147,0.25)]"
                    : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.3)]"
                )}
              >
                Markets
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://sepolia.mantlescan.xyz"
              target="_blank"
              className="hidden sm:flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors px-4 py-2 rounded-full hover:bg-[rgba(255,255,255,0.4)]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </Link>

            <div className="custom-connect-button-wrapper">
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Landing Hero (Only on Earn view) */}
      {activeView === 'earn' && <SpiritualHero />}

      <div className="container mx-auto px-4 md:px-6 py-8 relative z-10 max-w-7xl">
        {activeView === 'earn' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AccountSummary />
            <VaultsTable />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MarketsView />
          </div>
        )}
      </div>
    </main>
  );
}
