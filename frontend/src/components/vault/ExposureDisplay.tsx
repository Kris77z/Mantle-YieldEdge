import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ExposureAsset {
    symbol: string;
    icon: string;
    amount: string;
    percentage: number;
    color: string;
    isIdle?: boolean;
}

interface ExposureDisplayProps {
    assets: ExposureAsset[];
}

export function ExposureDisplay({ assets }: ExposureDisplayProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Limit to showing first 4 icons in stack
    const displayAssets = assets.slice(0, 4);
    const remainingCount = assets.length > 4 ? assets.length - 4 : 0;

    return (
        <div
            className="relative inline-flex items-center group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Stacked Icons */}
            <div className="flex -space-x-2 transition-all group-hover:space-x-1">
                {displayAssets.map((asset, index) => (
                    <div
                        key={asset.symbol}
                        className={cn(
                            "relative z-10 rounded-full ring-2 ring-[rgba(255,255,255,0.5)] bg-white w-7 h-7 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 shadow-sm",
                        )}
                        style={{ zIndex: 10 - index }}
                    >
                        <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-cover" />
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="relative z-0 rounded-full ring-2 ring-[rgba(255,255,255,0.5)] bg-[var(--surface-1)] flex items-center justify-center w-7 h-7 text-[10px] font-bold text-[var(--muted)] shadow-sm">
                        +{remainingCount}
                    </div>
                )}
            </div>

            {/* Hover Tooltip Card */}
            <div className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 w-72 bg-[rgba(255,255,255,0.95)] backdrop-blur-xl rounded-2xl shadow-xl border border-[var(--border)] p-5 transition-all duration-300 pointer-events-none",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}>
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-[var(--border)] rotate-45 shadow-sm"></div>

                <div className="relative space-y-4">
                    {assets.map((asset) => (
                        <div key={asset.symbol} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-[var(--borderSoft)]">
                                    <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-serif font-medium text-[var(--foreground)]">{asset.symbol}</span>
                                {asset.isIdle && (
                                    <span className="text-[10px] bg-[var(--surface-1)] text-[var(--muted)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Idle</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[var(--secondary)] font-serif">{asset.amount}</span>
                                <div className="relative w-4 h-4 ml-1 flex-shrink-0">
                                    {/* Pie Chart Indicator */}
                                    <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                                        <circle cx="16" cy="16" r="16" fill="rgba(148,116,147,0.1)" />
                                        <circle
                                            cx="16" cy="16" r="8"
                                            fill="none"
                                            stroke={asset.color || "#947493"}
                                            strokeWidth="16"
                                            strokeDasharray={`${asset.percentage} 100`}
                                            strokeDashoffset="0"
                                            pathLength="100"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
