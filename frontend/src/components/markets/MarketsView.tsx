'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, ArrowRight, Loader2, Sparkles, Zap } from 'lucide-react';
import { useAllMarkets, useMarketsInfo, useAvailableYield, useSimulateYield, useMarketInfo, useUserPrediction } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { PredictModal } from './PredictModal';
import { useAsset } from '@/context/AssetContext';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import Link from 'next/link';

// Markets configuration
const MARKET_CONFIG = {
    usdy: [
        {
            id: 'usdy-1',
            address: '0xa188527c4a95f0a413d3cb91c48c3d7be8745aaa',
            title: "Will BTC exceed $100k by end of January 2026?",
            closesAt: new Date('2026-01-31'),
            category: "Crypto",
            isHot: true,
            assetSymbol: 'yUSDY'
        },
        {
            id: 'usdy-2',
            address: '0x208a4954a9f35f8be65a945b995a8670cbfe3ca4',
            title: "Will ETH reach $5,000 by March 2026?",
            closesAt: new Date('2026-03-31'),
            category: "Crypto",
            isHot: true,
            assetSymbol: 'yUSDY'
        },
        {
            id: 'usdy-3',
            address: '0x59bc84620aa85452bc52b30e374e75a7904299a5',
            title: "Will Mantle TVL exceed $2B by Q2 2026?",
            closesAt: new Date('2026-06-30'),
            category: "DeFi",
            isHot: false,
            assetSymbol: 'yUSDY'
        }
    ],
    meth: [
        {
            id: 'meth-1',
            address: '0xf2523a47DDf6828faa9D1CbF76f8C65084E89037',
            title: "Will ETH flip BTC market cap in 2026?",
            closesAt: new Date('2026-12-31'),
            category: "Crypto",
            isHot: true,
            assetSymbol: 'mETH'
        },
        {
            id: 'meth-2',
            address: '0x4fD5e96342560A4da29C1515D0471Ef53771d910',
            title: "Will Mantle TVL hit $5B by Q4 2026?",
            closesAt: new Date('2026-10-01'),
            category: "DeFi",
            isHot: false,
            assetSymbol: 'mETH'
        }
    ]
};

interface MarketCardProps {
    market: any;
    mounted: boolean;
    isConnected: boolean;
    onPredict: (market: any, choice: 'yes' | 'no') => void;
    assetSymbol: string;
}

function MarketCard({ market, mounted, isConnected, onPredict, assetSymbol }: MarketCardProps) {
    // Determine colors based on category/hotness
    const isDeFi = market.category === 'DeFi';
    const cardClass = market.isHot
        ? "bg-[rgba(255,255,255,0.6)] border-[var(--gold)] hover:shadow-lg hover:shadow-[rgba(200,161,102,0.2)]"
        : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[rgba(148,116,147,0.15)]";

    return (
        <div key={market.id} className={`group relative rounded-[32px] border p-8 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm ${cardClass}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 bg-[rgba(148,116,147,0.1)] text-[var(--foreground)] border border-[rgba(148,116,147,0.15)] hover:bg-[rgba(148,116,147,0.2)] font-medium tracking-wide text-[10px] uppercase">
                        {market.category}
                    </Badge>
                    {market.isHot && (
                        <Badge variant="outline" className="rounded-full px-3 py-1 border-[var(--gold)] text-[#9A7D46] bg-[rgba(200,161,102,0.1)] flex items-center gap-1 font-medium tracking-wide text-[10px] uppercase">
                            <Sparkles className="w-3 h-3" /> Hot
                        </Badge>
                    )}
                    <Badge variant="outline" className="rounded-full px-3 py-1 border-[var(--borderSoft)] text-[var(--secondary)] bg-white/50 font-medium tracking-wide text-[10px] uppercase">
                        {assetSymbol} Market
                    </Badge>
                </div>
            </div>

            <h3 className="text-2xl font-serif text-[var(--foreground)] mb-8 leading-snug group-hover:text-[var(--primary)] transition-colors line-clamp-2 min-h-[4rem]">
                {market.title}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => onPredict(market, 'yes')}
                    className="relative overflow-hidden rounded-[20px] border border-[#a3bba4] bg-[#eef5ef] p-4 text-center transition-all hover:bg-[#dcebdd] hover:shadow-md group/btn"
                >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A6D4D] mb-1">Yes</span>
                    <span className="block text-xl font-serif text-[var(--foreground)]">50%</span>
                </button>
                <button
                    onClick={() => onPredict(market, 'no')}
                    className="relative overflow-hidden rounded-[20px] border border-[#dcbbbb] bg-[#f9eeee] p-4 text-center transition-all hover:bg-[#f2e0e0] hover:shadow-md group/btn"
                >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B4A4A] mb-1">No</span>
                    <span className="block text-xl font-serif text-[var(--foreground)]">50%</span>
                </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--secondary)] pt-6 border-t border-[var(--hairline)]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 opacity-80">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{market.closesAt.toLocaleDateString()}</span>
                    </div>
                </div>

                <button
                    onClick={() => onPredict(market, 'yes')}
                    className="flex items-center gap-2 font-bold text-[var(--primary)] group-hover:translate-x-1 transition-transform uppercase tracking-wider text-[10px]"
                >
                    Trade <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}


interface RealMarketCardProps {
    address: string;
    onPredict: (market: any, choice: 'yes' | 'no') => void;
    assetSymbol: string;
    iconUrl?: string;
    mounted: boolean;
    isConnected: boolean;
}

function RealMarketCard({ address, onPredict, assetSymbol, iconUrl, mounted, isConnected }: RealMarketCardProps) {
    const { useMarketInfo, useUserPrediction } = require('@/hooks/useYieldEdge');
    const { data: marketInfo, isLoading } = useMarketInfo(address);
    const { data: userPrediction } = useUserPrediction(address);

    if (isLoading || !marketInfo) {
        return (
            <div className="rounded-2xl border p-6 h-[280px] flex items-center justify-center bg-white border-slate-200">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
        );
    }

    // Check if user already predicted
    const hasUserPredicted = userPrediction?.hasPosition || false;
    const userChoice = userPrediction?.choice === 1 ? 'YES' : userPrediction?.choice === 2 ? 'NO' : null;

    // Market status: 0 = Open, 1 = Closed, 2 = Resolved
    const now = new Date();
    const isPastDeadline = marketInfo.closesAt < now;
    const isOpen = marketInfo.status === 0 && !isPastDeadline;
    const isClosed = marketInfo.status === 1 || (marketInfo.status === 0 && isPastDeadline);
    const isResolved = marketInfo.status === 2;
    const statusLabel = isResolved ? 'Resolved' : isPastDeadline ? 'Expired' : isOpen ? 'Open' : 'Closed';
    const outcomeLabel = marketInfo.outcome === 1 ? 'YES Won' : marketInfo.outcome === 2 ? 'NO Won' : '';

    // Map contract data to UI format
    const market = {
        id: address,
        address: address,
        title: marketInfo.question,
        closesAt: marketInfo.closesAt,
        category: 'Crypto',
        isHot: isOpen,
        yesPercentage: marketInfo.yesPercentage,
        totalPool: marketInfo.totalPool,
        status: marketInfo.status,
    };

    // Don't allow predictions on closed/resolved markets
    const handlePredict = isOpen ? onPredict : () => { };

    return (
        <div className={`group relative rounded-[32px] border p-8 transition-all duration-300 backdrop-blur-sm ${isOpen
            ? "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[rgba(148,116,147,0.15)] hover:-translate-y-1"
            : "bg-[var(--surface-1)] border-[var(--borderSoft)] opacity-70"
            }`}>
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 bg-[rgba(148,116,147,0.1)] text-[var(--foreground)] border border-[rgba(148,116,147,0.15)] font-medium tracking-wide text-[10px] uppercase">
                        {market.category}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 font-medium tracking-wide text-[10px] uppercase ${isOpen
                                ? "border-[#a3bba4] text-[#4A6D4D] bg-[#eef5ef]"
                                : isResolved
                                    ? "border-[rgba(148,116,147,0.3)] text-[var(--primary)] bg-[rgba(148,116,147,0.05)]"
                                    : "border-[var(--gold)] text-[#9A7D46] bg-[rgba(200,161,102,0.1)]"
                            }`}
                    >
                        {statusLabel}
                    </Badge>
                    {isResolved && outcomeLabel && (
                        <Badge variant="outline" className="rounded-full px-3 py-1 border-[var(--primary)] text-[var(--primary)] bg-[rgba(148,116,147,0.1)] font-medium tracking-wide text-[10px] uppercase">
                            {outcomeLabel}
                        </Badge>
                    )}
                </div>
            </div>

            <Link href={`/markets/${address}`}>
                <h3 className="text-2xl font-serif text-[var(--foreground)] mb-8 leading-snug cursor-pointer group-hover:text-[var(--primary)] transition-colors line-clamp-2 min-h-[4rem]">
                    {market.title}
                </h3>
            </Link>

            {isOpen ? (
                <>
                    {hasUserPredicted ? (
                        /* User Already Predicted */
                        <div className="text-center py-6 bg-[rgba(148,116,147,0.05)] rounded-[20px] border border-[rgba(148,116,147,0.15)] mb-6">
                            <div className="text-[var(--primary)] font-serif text-lg font-medium mb-1">
                                ✓ You predicted {userChoice}
                            </div>
                            <div className="text-xs text-[var(--secondary)] font-sans uppercase tracking-wider">
                                Staked: <span className="font-bold">{parseFloat(userPrediction?.yieldStaked || '0').toFixed(4)} {assetSymbol}</span>
                            </div>
                        </div>
                    ) : (
                        /* Yes/No Buttons */
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => handlePredict(market, 'yes')}
                                className="relative overflow-hidden rounded-[20px] border border-[#a3bba4] bg-[#eef5ef] p-4 text-center transition-all hover:bg-[#dcebdd] hover:shadow-md group/btn"
                            >
                                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A6D4D] mb-1">Yes</span>
                                <span className="block text-xl font-serif text-[var(--foreground)]">{market.yesPercentage}%</span>
                            </button>
                            <button
                                onClick={() => handlePredict(market, 'no')}
                                className="relative overflow-hidden rounded-[20px] border border-[#dcbbbb] bg-[#f9eeee] p-4 text-center transition-all hover:bg-[#f2e0e0] hover:shadow-md group/btn"
                            >
                                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B4A4A] mb-1">No</span>
                                <span className="block text-xl font-serif text-[var(--foreground)]">{(100 - parseFloat(market.yesPercentage)).toFixed(1)}%</span>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-[var(--secondary)] pt-6 border-t border-[var(--hairline)]">
                        <div className="flex items-center gap-1.5 opacity-80">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Closes: {market.closesAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[var(--muted)] opacity-80">
                                {iconUrl ? (
                                    <img src={iconUrl} alt={assetSymbol} className="w-4 h-4 rounded-full" />
                                ) : null}
                                <span>{parseFloat(market.totalPool).toFixed(2)} {assetSymbol}</span>
                            </div>
                            <Link href={`/markets/${address}`} className="text-[var(--primary)] hover:opacity-80 font-bold flex items-center gap-2 uppercase tracking-wider text-[10px]">
                                Trade <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Closed/Resolved State */}
                    <div className="text-center py-6 min-h-[120px] flex flex-col justify-center">
                        <div className="text-[var(--secondary)] font-serif text-lg mb-2 italic">
                            {isResolved ? 'Market Resolved' : 'Predictions Closed'}
                        </div>
                        {hasUserPredicted && (
                            <div className="text-[var(--primary)] text-sm mb-2 font-medium">
                                You predicted {userChoice} ({parseFloat(userPrediction?.yieldStaked || '0').toFixed(4)} {assetSymbol})
                            </div>
                        )}
                        <div className="text-[var(--muted)] text-[10px] uppercase tracking-wider">
                            Pool: {parseFloat(market.totalPool).toFixed(2)} {assetSymbol}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function MarketsView() {
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useAccount();
    const { currentAsset, assetConfig } = useAsset();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const { data: yieldBalance } = useAvailableYield();

    // Fetch Real Markets
    const { data: realMarketAddresses, isLoading: marketsLoading } = useAllMarkets();

    // Yield Simulation (Demo)
    const { simulate, isPending: isSimulating, isSuccess: simSuccess } = useSimulateYield();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle simulation success
    useEffect(() => {
        if (simSuccess) {
            toast.success('Yield Simulated!', {
                description: '10 Tokens donated to vault to increase share price.'
            });
        }
    }, [simSuccess]);

    // Modal State
    const [isPredictOpen, setIsPredictOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<any>(null);
    const [selectedChoice, setSelectedChoice] = useState<'yes' | 'no'>('yes');

    // Get current mock markets based on asset context
    const currentMockMarkets = MARKET_CONFIG[currentAsset] || [];

    const categories = ['All', 'Crypto', 'DeFi', 'Macro'];

    const handlePredict = (market: any, choice: 'yes' | 'no') => {
        setSelectedMarket(market);
        setSelectedChoice(choice);
        setIsPredictOpen(true);
    };

    // Refresh data after successful prediction
    const queryClient = useQueryClient();
    const handlePredictSuccess = () => {
        // Invalidate all queries to refresh data
        queryClient.invalidateQueries();
        toast.success('Prediction placed!', {
            description: 'Your prediction has been recorded on-chain.'
        });
    };

    return (
        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-serif text-[var(--foreground)] flex items-center gap-3 mb-2">
                        Active Markets
                        <div className="text-[10px] font-bold tracking-widest px-3 py-1 bg-[rgba(148,116,147,0.1)] text-[var(--primary)] rounded-full border border-[rgba(148,116,147,0.2)] uppercase">
                            {(realMarketAddresses?.length || 0)} Live
                        </div>
                    </h2>
                    <p className="text-[var(--secondary)] text-lg max-w-lg leading-relaxed">
                        Predict outcomes using your {assetConfig.symbol} yield. <br />
                        <span className="text-[var(--primary)] italic font-serif">Zero risk to principal. All upside.</span>
                    </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                    {/* Clean Demo Button */}
                    <button
                        onClick={() => simulate('10')}
                        disabled={isSimulating}
                        className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                        title="Donates 10 tokens to vault to simulate yield generation"
                    >
                        {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Simulate Yield (+10 {assetConfig.symbol})
                    </button>

                    <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.4)] p-1.5 rounded-full border border-[var(--borderSoft)]">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                                    selectedCategory === cat
                                        ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(148,116,147,0.2)]"
                                        : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.5)]"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Loading Skeletons */}
                {marketsLoading && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-[32px] border border-[var(--border)] p-8 h-[360px] bg-[var(--card)] animate-pulse">
                                <div className="flex gap-2 mb-6">
                                    <div className="h-6 w-20 bg-[var(--surface-2)] rounded-full" />
                                    <div className="h-6 w-16 bg-[var(--surface-2)] rounded-full" />
                                </div>
                                <div className="h-8 w-full bg-[var(--surface-2)] rounded-lg mb-3" />
                                <div className="h-8 w-3/4 bg-[var(--surface-2)] rounded-lg mb-8" />
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="h-24 bg-[var(--surface-1)] rounded-[20px]" />
                                    <div className="h-24 bg-[var(--surface-1)] rounded-[20px]" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-[var(--surface-2)] rounded" />
                                    <div className="h-4 w-20 bg-[var(--surface-2)] rounded" />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Render Real Markets */}
                {!marketsLoading && realMarketAddresses?.map((address: string) => (
                    <RealMarketCard
                        key={address}
                        address={address}
                        onPredict={handlePredict}
                        assetSymbol={assetConfig.symbol}
                        iconUrl={assetConfig.icon}
                        mounted={mounted}
                        isConnected={isConnected}
                    />
                ))}

                {/* Empty State */}
                {!marketsLoading && !realMarketAddresses?.length && (
                    <div className="col-span-full rounded-[32px] border-2 border-dashed border-[var(--border)] p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px] bg-[var(--surface-1)]/50">
                        <div className="w-16 h-16 bg-[var(--surface-2)] rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-[var(--muted)]" />
                        </div>
                        <h3 className="font-serif text-xl text-[var(--foreground)] mb-2">No Markets Available</h3>
                        <p className="text-sm text-[var(--secondary)] max-w-[240px] leading-relaxed">
                            The spirits are quiet. Check back later for new opportunities.
                        </p>
                    </div>
                )}
            </div>

            {selectedMarket && (
                <PredictModal
                    isOpen={isPredictOpen}
                    onClose={() => setIsPredictOpen(false)}
                    onSuccess={handlePredictSuccess}
                    marketAddress={selectedMarket.address}
                    marketTitle={selectedMarket.title}
                    initialChoice={selectedChoice}
                    assetSymbol={assetConfig.symbol}
                />
            )}
        </section>
    );
}
