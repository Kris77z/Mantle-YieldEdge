import React from 'react';
import { Shield, Zap, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export function SpiritualHero() {
    return (
        <div className="relative w-full overflow-hidden py-16 md:py-24">

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Text Content */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--surface-1)] backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--primary)]">Mantle Season 2 Live</span>
                        </div>

                        <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl text-[var(--foreground)] tracking-tight leading-[1.0] max-w-2xl">
                            The Higher State of <span className="italic text-[var(--primary)]">Prediction Markets</span>
                        </h1>

                        <p className="font-sans text-[var(--secondary)] text-lg md:text-xl max-w-lg leading-relaxed font-medium">
                            Experience the first zero-loss prediction market on Mantle. Time-travel your future yield to place bets instantly, without ever risking your principal.
                        </p>

                        {/* Three Pillars - Moved up slightly since buttons are gone */}
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[var(--borderSoft)] mt-8 opacity-90">
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#E8E0D5] flex items-center justify-center text-[var(--primary)] border border-[var(--borderSoft)]">
                                    <Zap className="w-5 h-5 fill-current opacity-80" />
                                </div>
                                <h4 className="font-serif text-sm font-bold text-[var(--foreground)]">Flash Yield</h4>
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Instant betting</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#E8E0D5] flex items-center justify-center text-[var(--primary)] border border-[var(--borderSoft)]">
                                    <Shield className="w-5 h-5 opacity-80" />
                                </div>
                                <h4 className="font-serif text-sm font-bold text-[var(--foreground)]">Zero Loss</h4>
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Principal protected</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#E8E0D5] flex items-center justify-center text-[var(--primary)] border border-[var(--borderSoft)]">
                                    <TrendingUp className="w-5 h-5 opacity-80" />
                                </div>
                                <h4 className="font-serif text-sm font-bold text-[var(--foreground)]">Native</h4>
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">mETH & USDY</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Crystal Image Archway */}
                    <div className="relative flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                        <div className="relative w-[350px] md:w-[450px] aspect-[3/4]">
                            {/* Arch Shape Container */}
                            <div className="absolute inset-0 border-[1.5px] border-[#C8A166]/60 rounded-t-[999px] z-20 pointer-events-none transform translate-x-4 -translate-y-4" />

                            <div className="absolute inset-0 rounded-t-[999px] overflow-hidden shadow-2xl z-10 bg-[#E8E0D5]">
                                <Image
                                    src="/images/spiritual_crystal_archway.png"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                    alt="YieldEdge Crystal Vault"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/20 to-transparent mix-blend-overlay" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Soft decorative background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#947493] opacity-[0.05] blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#C8A166] opacity-[0.05] blur-[150px] rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
        </div>
    );
}
