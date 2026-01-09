'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Clock, Loader2, Sparkles, Zap, ArrowRight, Bookmark } from 'lucide-react';
import { useAllMarkets, useMarketInfo, useUserPrediction, useAvailableYield, useSimulateYield } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { PredictModal } from './PredictModal';
import { useAsset } from '@/context/AssetContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Polymarket-style Market Card
interface MarketCardProps {
    address: string;
    assetSymbol: string;
    onPredict: (market: any, choice: 'yes' | 'no') => void;
}

function PolyMarketCard({ address, assetSymbol, onPredict }: MarketCardProps) {
    const router = useRouter();
    const { data: marketInfo, isLoading } = useMarketInfo(address);
    const { data: userPrediction } = useUserPrediction(address);

    if (isLoading || !marketInfo) {
        return (
            <div className="bg-[var(--card)]/50 rounded-[24px] p-6 border border-[var(--borderSoft)] animate-pulse h-[220px]" />
        );
    }

    // Market status
    const now = new Date();
    const isPastDeadline = marketInfo.closesAt < now;
    const isOpen = marketInfo.status === 0 && !isPastDeadline;
    const isResolved = marketInfo.status === 2;
    const outcomeLabel = marketInfo.outcome === 1 ? 'Yes' : marketInfo.outcome === 2 ? 'No' : '';

    // User prediction
    const hasUserPredicted = userPrediction?.hasPosition || false;
    const userChoice = userPrediction?.choice === 1 ? 'YES' : userPrediction?.choice === 2 ? 'NO' : null;

    const yesPercentage = parseFloat(marketInfo.yesPercentage);
    const pool = parseFloat(marketInfo.totalPool);

    const market = {
        address,
        title: marketInfo.question,
        closesAt: marketInfo.closesAt,
        yesPercentage,
        totalPool: marketInfo.totalPool,
    };

    const handleCardClick = () => {
        router.push(`/markets/${address}`);
    };

    return (
        <div
            className={cn(
                "bg-[var(--card)] backdrop-blur-md rounded-[24px] p-6 border border-[var(--borderSoft)] hover:border-[var(--primary)]/30 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden",
                !isOpen && "opacity-60 grayscale"
            )}
            onClick={handleCardClick}
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-[var(--foreground)] pointer-events-none transition-transform group-hover:scale-110">
                <Sparkles className="w-24 h-24" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    {isOpen && pool > 0.1 && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#b45309] bg-[#b45309]/10 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" />
                            Hot
                        </span>
                    )}
                    {isResolved && (
                        <Badge className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 shadow-none uppercase tracking-wider">
                            Resolved
                        </Badge>
                    )}
                    {!isOpen && !isResolved && (
                        <Badge variant="secondary" className="text-[10px] bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--border)] shadow-none uppercase tracking-wider">
                            Expired
                        </Badge>
                    )}
                </div>
                {/* Probability Circle */}
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-3xl font-serif font-medium leading-none",
                        isResolved
                            ? (outcomeLabel === 'Yes' ? "text-[#4A6D4D]" : "text-[#8B4A4A]")
                            : "text-[var(--foreground)]"
                    )}>
                        {isResolved ? (outcomeLabel === 'Yes' ? '100' : '0') : yesPercentage.toFixed(0)}%
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">chance</span>
                </div>
            </div>

            {/* Title */}
            <Link href={`/markets/${address}`} className="block relative z-10">
                <h3 className="text-xl font-serif font-medium text-[var(--foreground)] mb-6 line-clamp-2 min-h-[56px] group-hover:text-[var(--primary)] transition-colors leading-tight">
                    {marketInfo.question}
                </h3>
            </Link>

            {/* User Position */}
            {hasUserPredicted && (
                <div className="mb-4 text-xs text-[var(--primary)] flex items-center gap-2 font-bold bg-[var(--primary)]/5 p-2 rounded-lg border border-[var(--primary)]/10">
                    <span>✓ You: {userChoice}</span>
                    <span className="text-[var(--muted)] font-normal">({parseFloat(userPrediction?.yieldStaked || '0').toFixed(4)})</span>
                </div>
            )}

            {/* Yes/No Buttons or Outcome */}
            {isOpen && !hasUserPredicted ? (
                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPredict(market, 'yes'); }}
                        className="py-3 px-4 rounded-[14px] bg-[#4A6D4D]/5 hover:bg-[#4A6D4D]/10 border border-[#4A6D4D]/20 text-[#4A6D4D] text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                    >
                        Yes
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onPredict(market, 'no'); }}
                        className="py-3 px-4 rounded-[14px] bg-[#8B4A4A]/5 hover:bg-[#8B4A4A]/10 border border-[#8B4A4A]/20 text-[#8B4A4A] text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                    >
                        No
                    </button>
                </div>
            ) : isResolved ? (
                <div className={cn(
                    "py-3 px-4 rounded-[14px] text-center text-xs font-bold uppercase tracking-widest mb-4",
                    outcomeLabel === 'Yes'
                        ? "bg-[#4A6D4D]/10 text-[#4A6D4D] border border-[#4A6D4D]/30"
                        : "bg-[#8B4A4A]/10 text-[#8B4A4A] border border-[#8B4A4A]/30"
                )}>
                    {outcomeLabel} Won
                </div>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] pt-4 border-t border-[var(--borderSoft)] font-medium uppercase tracking-wide relative z-10">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{marketInfo.closesAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[var(--secondary)] font-bold">{pool.toFixed(2)} {assetSymbol}</span>
                    <Link
                        href={`/markets/${address}`}
                        className="text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1 group/link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Trade <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function MarketsViewPoly() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useAccount();
    const { currentAsset, assetConfig } = useAsset();
    const queryClient = useQueryClient();

    // Get real markets from factory
    const { data: realMarketAddresses, isLoading: marketsLoading } = useAllMarkets();

    // Simulate yield
    const { simulate, isPending: simPending, isSuccess: simSuccess } = useSimulateYield();
    const { data: availableYield } = useAvailableYield();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (simSuccess) {
            queryClient.invalidateQueries();
            toast.success('Yield simulated!', {
                description: '10 USDY has been added to generate yield.'
            });
        }
    }, [simSuccess, queryClient]);

    // Modal State
    const [isPredictOpen, setIsPredictOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<any>(null);
    const [selectedChoice, setSelectedChoice] = useState<'yes' | 'no'>('yes');

    const [activeCategory, setActiveCategory] = useState('All');
    const categories = ['All', 'Crypto', 'DeFi', 'Politics', 'Sports'];

    const handlePredict = (market: any, choice: 'yes' | 'no') => {
        setSelectedMarket(market);
        setSelectedChoice(choice);
        setIsPredictOpen(true);
    };

    const handlePredictSuccess = () => {
        queryClient.invalidateQueries();
        toast.success('Prediction placed!', {
            description: 'Your prediction has been recorded on-chain.'
        });
    };

    const handleSimulateYield = () => {
        simulate();
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--primary)] selection:text-white">

            {/* HERO SECTION */}
            <div className="relative w-full min-h-[70vh] flex flex-col justify-center items-center overflow-hidden border-b border-[var(--border)]">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 inset-0 z-0 opacity-40">
                    <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#947493] mix-blend-multiply filter blur-[100px] animate-nebula-swirl opacity-30" />
                    <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#C8A166] mix-blend-multiply filter blur-[120px] animate-nebula-swirl animation-delay-2000 opacity-30" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <div className="mb-8 animate-majestic-float">
                        <Badge variant="outline" className="bg-[var(--surface-1)] text-[var(--primary)] border-[var(--primary)]/30 uppercase tracking-[0.2em] py-2 px-6 shadow-sm backdrop-blur-md rounded-full text-[10px] font-bold">
                            <Sparkles className="w-3 h-3 mr-2 inline-block" />
                            Season 2 is Live
                        </Badge>
                    </div>

                    <h1 className="font-serif text-7xl md:text-9xl text-[var(--foreground)] tracking-tight leading-[0.9] mb-8">
                        <span className="block font-light italic text-[var(--primary)]/80">Spiritual</span>
                        <span className="block font-medium">Yield Markets</span>
                    </h1>

                    <p className="font-sans text-[var(--secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12 font-medium tracking-wide">
                        Harmonize your portfolio. Predict outcomes, earn yield, and flow with the market on Mantle's premier prediction layer.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-10 py-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-bold uppercase tracking-widest text-xs shadow-[0_10px_30px_-10px_rgba(148,116,147,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(148,116,147,0.6)] hover:-translate-y-1 transition-all duration-300">
                            Start Healing
                        </button>
                        <button className="w-full sm:w-auto px-10 py-5 rounded-full bg-[var(--surface-1)] text-[var(--foreground)] border border-[var(--border)] font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-[var(--surface-2)] hover:border-[var(--primary)]/30 transition-all duration-300 backdrop-blur-sm">
                            View Vaults
                        </button>
                    </div>
                </div>

                {/* Bottom Blur Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent z-10" />
            </div>

            {/* Header */}
            <div className="border-b border-[var(--border)] bg-[rgba(225,217,203,0.8)] backdrop-blur-md sticky top-0 z-20 transition-all">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Categories */}
                    <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[#b45309] bg-[#b45309]/5 hover:bg-[#b45309]/10 transition-colors border border-transparent hover:border-[#b45309]/20">
                            <Flame className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Trending</span>
                        </button>
                        <div className="w-px h-6 bg-[var(--borderSoft)] mx-2" />
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                                    activeCategory === cat
                                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md"
                                        : "bg-[var(--surface-1)] text-[var(--muted)] border-[var(--borderSoft)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-serif font-medium text-[var(--foreground)]">Markets</h2>
                        <Badge variant="outline" className="bg-[var(--surface-1)] text-[var(--primary)] border-[var(--borderSoft)] hidden md:inline-flex">
                            {realMarketAddresses?.length || 0} Live
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-[var(--muted)] font-medium hidden md:block uppercase tracking-wide">
                            Available Yield: <span className="text-[var(--foreground)] font-bold ml-1">{parseFloat(availableYield || '0').toFixed(4)} {assetConfig.symbol}</span>
                        </div>
                        <button
                            onClick={handleSimulateYield}
                            disabled={simPending}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] transition-all shadow-lg active:scale-95 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {simPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Simulate Yield
                        </button>
                    </div>
                </div>

                {/* Markets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {marketsLoading ? (
                        // Loading skeletons
                        Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-[var(--card)]/50 rounded-[24px] p-6 border border-[var(--borderSoft)] animate-pulse h-[220px]"
                            />
                        ))
                    ) : realMarketAddresses && realMarketAddresses.length > 0 ? (
                        realMarketAddresses.map((address: string) => (
                            <PolyMarketCard
                                key={address}
                                address={address}
                                assetSymbol={assetConfig.symbol}
                                onPredict={handlePredict}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-[var(--surface-1)] rounded-[32px] border border-[var(--borderSoft)] border-dashed">
                            <div className="text-[var(--muted)] mb-4 font-serif text-xl italic">No markets available</div>
                            <p className="text-xs text-[var(--secondary)] uppercase tracking-wide font-bold">Check back later for new opportunities.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Predict Modal */}
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
        </div>
    );
}
