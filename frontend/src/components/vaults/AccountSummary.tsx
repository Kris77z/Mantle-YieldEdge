'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, TrendingUp, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useDepositInfo, useAvailableYield } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { useAsset, AssetType } from '@/context/AssetContext';

export function AccountSummary() {
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useAccount();
    const { currentAsset, assetConfig, setAsset } = useAsset();
    const { data: depositInfo, isLoading: isLoadingDeposit } = useDepositInfo();
    const { data: availableYield, isLoading: isLoadingYield } = useAvailableYield();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper for formatting
    const formatValue = (val: string | undefined, decimals = 2) => {
        if (!val) return '0.00';
        return parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    const displayDeposit = depositInfo?.currentValue ? formatValue(depositInfo.currentValue, 2) : '0.00';
    const displayAPY = depositInfo?.apy || assetConfig.apy.replace('%', '');
    const displayYield = availableYield ? formatValue(availableYield, 4) : '0';
    const currencySymbol = currentAsset === 'usdy' ? '$' : 'Ξ';

    const isLoading = !mounted || isLoadingDeposit || isLoadingYield;
    if (mounted && !isConnected) {
        // Handle disconnected state visually if needed, but we share similar UI structure
    }

    const toggleAsset = (asset: AssetType) => {
        setAsset(asset);
        setIsDropdownOpen(false);
    };

    return (
        <div className="w-full bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 relative transition-all duration-300">
            {/* Background decorative elements */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-[var(--primary)] rounded-full blur-[128px] opacity-10 -z-10 translate-x-32 -translate-y-32 pointer-events-none transition-colors duration-500`} />

            {/* Left Section: Deposits */}
            <div className="flex flex-col gap-2 z-10 w-full md:w-auto relative">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors font-medium text-sm group bg-[rgba(255,255,255,0.5)] px-4 py-2 rounded-full border border-[var(--borderSoft)]"
                        >
                            <div className="w-5 h-5 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-[10px] font-serif">
                                {assetConfig.symbol[0]}
                            </div>
                            <span className="uppercase tracking-wider text-xs font-bold">{assetConfig.name}</span>
                            <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[rgba(255,255,255,0.9)] backdrop-blur-xl border border-[var(--borderSoft)] rounded-[20px] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => toggleAsset('usdy')}
                                    className={`w-full text-left px-5 py-3 text-sm hover:bg-[rgba(148,116,147,0.05)] flex items-center gap-3 transition-colors ${currentAsset === 'usdy' ? 'bg-[rgba(148,116,147,0.05)]' : 'text-[var(--secondary)]'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#eef5ef] text-[#4A6D4D] flex items-center justify-center text-sm font-serif font-bold italic">$</div>
                                    <div>
                                        <div className="text-[var(--foreground)] font-serif">Ondo USDY</div>
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">5.0% APY</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => toggleAsset('meth')}
                                    className={`w-full text-left px-5 py-3 text-sm hover:bg-[rgba(148,116,147,0.05)] flex items-center gap-3 transition-colors ${currentAsset === 'meth' ? 'bg-[rgba(148,116,147,0.05)]' : 'text-[var(--secondary)]'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-[rgba(148,116,147,0.1)] text-[var(--primary)] flex items-center justify-center text-sm font-serif font-bold italic">Ξ</div>
                                    <div>
                                        <div className="text-[var(--foreground)] font-serif">Mantle ETH</div>
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">3.8% APY</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-7xl font-serif text-[var(--foreground)] tracking-tight flex items-center gap-3 mt-6">
                    {isLoading ? (
                        <Loader2 className="w-12 h-12 animate-spin text-[var(--muted)]" />
                    ) : mounted && !isConnected ? (
                        <span className="text-[var(--muted)] opacity-30">{currencySymbol}0.00</span>
                    ) : (
                        <span>{currencySymbol}{displayDeposit}</span>
                    )}
                </div>

                {mounted && isConnected && depositInfo && parseFloat(depositInfo.principal) > 0 && (
                    <div className="flex items-center gap-6 text-sm text-[var(--secondary)] mt-2 pl-2">
                        <span>Principal: <span className="font-medium text-[var(--foreground)]">{currencySymbol}{formatValue(depositInfo.principal)}</span></span>
                        <span className="flex items-center gap-1 text-[var(--primary)]">
                            <Sparkles className="w-3 h-3" />
                            <span>+{currencySymbol}{formatValue(depositInfo.totalYield, 4)} yield</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Right Section: Stats */}
            <div className="flex items-center gap-12 md:gap-20 z-10 w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-[var(--borderSoft)]">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-bold uppercase tracking-widest mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#4A6D4D]" />
                        <span>Current APY</span>
                    </div>
                    <div className="text-4xl font-serif text-[var(--foreground)]">
                        {displayAPY}<span className="text-xl text-[var(--muted)] font-normal ml-1">%</span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] opacity-60 uppercase tracking-wider">Variable rate</div>
                </div>

                <div className="h-16 w-px bg-[var(--borderSoft)] hidden md:block" />

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-bold uppercase tracking-widest mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                        <span>Available Yield</span>
                    </div>
                    <div className={`text-4xl font-serif ${parseFloat(displayYield) > 0 ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                        {currencySymbol}{displayYield}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] opacity-60 uppercase tracking-wider">Risk-free betting power</div>
                </div>
            </div>
        </div>
    );
}
