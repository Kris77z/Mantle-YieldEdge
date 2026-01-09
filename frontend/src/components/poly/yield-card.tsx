"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Gauge } from "./gauge";
import { useAutoFitText } from "@/lib/useAutoFitText";
import { motion } from "framer-motion";
import { TierAura, TierOverlays } from "./tier-effects";
import { Button } from "@/components/ui/button";

export interface YieldCardProps {
    asset: {
        name: string;
        protocol: string;
        market: string;
        icon: React.ReactNode;
        totalPool: string;
        apy: string;
        apyValue: number; // For gauge and tier logic
    };
    onAction: (asset: any, action: 'earn' | 'bet') => void;
}

export function YieldCard({ asset, onAction }: YieldCardProps) {
    // Map APY to Tiers
    // > 20% = God
    // > 15% = Super
    // > 10% = Mega
    // > 5% = Whale
    // else Standard
    const apy = asset.apyValue;
    const isGod = apy >= 20;
    const isSuper = apy >= 15 && apy < 20;
    const isMega = apy >= 10 && apy < 15;
    const isWhale = apy >= 5 && apy < 10;
    const isStandard = !isGod && !isSuper && !isMega && !isWhale;

    const { textRef } = useAutoFitText({
        minFontSize: 0.75,
        maxFontSize: 1.125,
        maxLines: 3,
        lineHeight: 1.2,
    });

    // Portal animation variants
    const portalVariants = {
        initial: {
            y: -20,
            opacity: 0,
            scale: 0.92,
            filter: "blur(12px)",
        },
        animate: {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 30,
                mass: 1
            }
        }
    };

    return (
        <motion.div
            layout="position"
            initial="initial"
            animate="animate"
            variants={portalVariants}
            className="group relative h-full select-none hover:z-30 cursor-pointer will-change-transform"
        >
            <TierAura isGod={isGod} />

            <Card className={cn(
                "relative z-10 h-full p-4 transition-all duration-300 ease-out rounded-xl overflow-hidden border backdrop-blur-md pb-0",
                // Standard Tier (Default)
                isStandard && "bg-surface-2 border border-white/10 shadow-[5px_5px_0px_0px_rgba(216,217,221,0.30)] group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-[6px_6px_0px_0px_rgba(216,217,221,0.30)]",

                // Whale Tier - Subtle Blue
                isWhale && "bg-[radial-gradient(circle_at_22%_18%,rgba(99,179,237,0.45)_0%,rgba(14,30,54,0.78)_40%,rgba(8,14,34,0.95)_78%)] border-sky-400/50 shadow-[5px_5px_0px_0px_rgba(56,189,248,0.24)] group-hover:shadow-[6px_6px_0px_0px_rgba(56,189,248,0.32)] group-hover:border-sky-300/70 group-hover:-translate-y-1",

                // Mega Whale - Pulsing Purple
                isMega && "bg-purple-950/20 border-purple-500/20 shadow-[5px_5px_0px_0px_rgba(168,85,247,0.2)] group-hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,0.3)] group-hover:-translate-y-1",

                // Super Whale - Deep Crimson
                isSuper && "bg-[radial-gradient(circle_at_24%_18%,rgba(130,34,34,0.55)_0%,rgba(71,10,10,0.9)_42%,rgba(12,4,4,0.95)_78%)] border-[rgba(130,34,34,0.6)] shadow-[5px_5px_0px_0px_rgba(130,34,34,0.22)] group-hover:shadow-[6px_6px_0px_0px_rgba(178,60,60,0.28)] group-hover:border-[rgba(178,60,60,0.75)] group-hover:-translate-y-1",

                // God Whale - Mythic Gold
                isGod && "bg-yellow-950/80 border-yellow-500/40 shadow-[5px_5px_0px_0px_rgba(251,191,36,0.44)] group-hover:shadow-[6px_6px_0px_0px_rgba(251,191,36,0.32)] group-hover:border-yellow-400/70 group-hover:-translate-y-1",

                // Fallback / Debug
                "bg-zinc-950"
            )}>
                <TierOverlays isGod={isGod} isSuper={isSuper} isMega={isMega} isWhale={isWhale} />

                {isStandard && (
                    <div
                        className="pointer-events-none absolute inset-0 bg-white/5 opacity-10 mix-blend-overlay"
                        aria-hidden
                    />
                )}

                <div className={cn(
                    "relative z-10 grid grid-cols-[1fr_auto] gap-2",
                    isSuper && "animate-heat-distortion"
                )}>
                    {/* Top Left: Title */}
                    <div className="flex items-start min-w-0 pr-2">
                        <div className="relative group/title w-full flex gap-3">
                            {/* Asset Icon */}
                            <div className={cn(
                                "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/20 shadow-2xl backdrop-blur-sm flex items-center justify-center bg-black/40",
                            )}>
                                <div className="scale-150 transform">
                                    {asset.icon}
                                </div>

                                {/* Glow Effect */}
                                <div className="absolute inset-0 ring-1 ring-white/10 group-hover/title:ring-white/20 transition-all duration-300" />
                            </div>

                            <div className="relative flex-1 min-w-0">
                                {/* Accent Bar */}
                                <div className={cn(
                                    "absolute -left-2 top-1 bottom-1 w-[2px] rounded-full opacity-30",
                                    isGod ? "bg-yellow-400" :
                                        isSuper ? "bg-[#8e2a2a]" :
                                            isMega ? "bg-purple-500" :
                                                isWhale ? "bg-sky-300" :
                                                    "bg-zinc-600"
                                )} />

                                <div className="flex flex-col gap-0.5">
                                    <h3
                                        ref={textRef as React.RefObject<HTMLHeadingElement>}
                                        className={cn(
                                            "font-bold uppercase tracking-tight leading-[1.1] min-h-10 flex flex-col justify-center text-balance",
                                            isGod ? "text-yellow-100" :
                                                isSuper ? "text-[#f3d7d7]" :
                                                    isMega ? "text-purple-100" :
                                                        isWhale ? "text-sky-50" :
                                                            "text-zinc-100"
                                        )}
                                        title={asset.name}
                                    >
                                        <span className="line-clamp-2 w-full text-lg">
                                            {asset.name}
                                        </span>
                                    </h3>

                                    <div className="flex flex-col text-[10px] font-medium text-zinc-500">
                                        <span>{asset.protocol}</span>
                                        <span className="text-zinc-400 truncate max-w-[200px]">{asset.market}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Right: TVL */}
                    <div className="flex items-start justify-end">
                        <div className="relative flex items-baseline gap-1 py-1 px-3 bg-black/20 rounded-lg border border-white/5">
                            <span className={cn(
                                "text-xs font-medium",
                                isGod ? "text-yellow-500/90" : "text-zinc-500"
                            )}>TVL</span>

                            <span className={cn(
                                "text-lg font-semibold tracking-tight text-zinc-100"
                            )}>
                                {asset.totalPool}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Row: Scoreboard/Gauge */}
                    <div className="col-span-2 flex items-end justify-between gap-3 relative mt-4">

                        {/* Action Buttons (replacing Outcome) */}
                        <div className="flex gap-2 flex-1">
                            <Button
                                size="sm"
                                className={cn(
                                    "flex-1 font-bold tracking-wider text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-zinc-400",
                                    isGod && "border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10"
                                )}
                                onClick={() => onAction(asset, 'earn')}
                            >
                                DEPOSIT
                            </Button>
                            <Button
                                size="sm"
                                className={cn(
                                    "flex-1 font-bold tracking-wider text-xs",
                                    "bg-primary text-black hover:bg-primary/90"
                                )}
                                onClick={() => onAction(asset, 'bet')}
                            >
                                BET
                            </Button>
                        </div>

                        {/* Gauge */}
                        <div className="shrink-0 h-16 w-16">
                            <Gauge
                                value={apy}
                                label="APY"
                                size={64}
                                strokeWidth={4}
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Ribbon Footer */}
                <div className={cn(
                    "relative -mx-4 mt-3 pt-2 pb-2 px-4 border-t",
                    "bg-black/20 backdrop-blur-md flex justify-between items-center text-[10px] uppercase font-bold tracking-widest",
                    isGod ? "border-t-yellow-500/20 text-yellow-500/50" :
                        isSuper ? "border-t-red-500/20 text-red-500/50" :
                            "border-t-white/5 text-zinc-700"
                )}>
                    <span>Principal Protected</span>
                    <span>Mantle Network</span>
                </div>
            </Card>
        </motion.div>
    );
}
