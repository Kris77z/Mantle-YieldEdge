'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Clock, TrendingUp, ExternalLink, ShieldCheck, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { useMarketInfo, useUserPrediction, useAvailableYield, usePredict, usePotentialWinnings } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useAsset } from '@/context/AssetContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MarketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const address = params.address as string;
    const queryClient = useQueryClient();

    const { isConnected } = useAccount();
    const { currentAsset, assetConfig } = useAsset();

    // Market data
    const { data: marketInfo, isLoading: marketLoading } = useMarketInfo(address);
    const { data: userPrediction } = useUserPrediction(address);
    const { data: availableYield } = useAvailableYield();

    // Trade state
    const [choice, setChoice] = useState<'yes' | 'no'>('yes');
    const [amount, setAmount] = useState('');
    const { predict, isPending, isConfirming, isSuccess, error } = usePredict(address);
    const { data: potentialWinnings } = usePotentialWinnings(address, choice, amount);

    // Handle success
    useEffect(() => {
        if (isSuccess) {
            queryClient.invalidateQueries();
            toast.success('Prediction placed!', {
                description: 'Your prediction has been recorded on-chain.'
            });
            setAmount('');
        }
    }, [isSuccess, queryClient]);

    if (marketLoading || !marketInfo) {
        return (
            <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </main>
        );
    }

    // Market status
    const now = new Date();
    const isPastDeadline = marketInfo.closesAt < now;
    const isOpen = marketInfo.status === 0 && !isPastDeadline;
    const isResolved = marketInfo.status === 2;
    const statusLabel = isResolved ? 'Resolved' : isPastDeadline ? 'Expired' : isOpen ? 'Open' : 'Closed';
    const outcomeLabel = marketInfo.outcome === 1 ? 'Yes' : marketInfo.outcome === 2 ? 'No' : '';

    // User prediction status
    const hasUserPredicted = userPrediction?.hasPosition || false;
    const userChoice = userPrediction?.choice === 1 ? 'YES' : userPrediction?.choice === 2 ? 'NO' : null;

    // Trade calculations
    const availableYieldValue = parseFloat(availableYield || '0');
    const amountValue = parseFloat(amount || '0');
    const yesPrice = parseFloat(marketInfo.yesPercentage) / 100;
    const noPrice = 1 - yesPrice;
    const potentialReturn = parseFloat(potentialWinnings || '0');

    const handlePredict = () => {
        if (amountValue <= 0 || amountValue > availableYieldValue) return;
        predict(choice, amount);
    };

    const currency = assetConfig.symbol.includes('USD') ? '$' : '';

    return (
        <main className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(225,217,203,0.8)] backdrop-blur-md">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex flex-col">
                            <span className="font-serif font-medium text-2xl tracking-normal text-[var(--foreground)]">
                                YieldEdge
                            </span>
                            <span className="text-[10px] text-[var(--muted)] tracking-[0.25em] font-sans uppercase translate-y-[-2px]">
                                Mantle Markets
                            </span>
                        </div>
                    </Link>
                    <CustomConnectButton />
                </div>
            </header>

            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10 max-w-[1440px]">
                {/* Breadcrumbs */}
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] mb-8 font-bold uppercase tracking-widest">
                    <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Markets</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[var(--foreground)] truncate max-w-[300px] font-bold">{marketInfo.question}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* LEFT COLUMN: Main Info */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Market Title Header */}
                        <div className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center text-4xl font-serif font-bold italic shadow-lg shrink-0">
                                    ?
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge
                                            className={cn(
                                                "rounded-full px-3 py-1 font-medium tracking-wide text-[10px] uppercase shadow-none",
                                                isOpen ? "bg-[#4A6D4D]/10 text-[#4A6D4D] border border-[#4A6D4D]/30" :
                                                    isResolved ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" :
                                                        "bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30"
                                            )}
                                        >
                                            {statusLabel}
                                        </Badge>
                                        {isResolved && outcomeLabel && (
                                            <Badge className="rounded-full px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)] font-medium tracking-wide text-[10px] uppercase shadow-none">
                                                {outcomeLabel} Won
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="rounded-full px-3 py-1 bg-[var(--surface-1)] text-[var(--secondary)] border border-[var(--borderSoft)] font-medium tracking-wide text-[10px] uppercase shadow-none">
                                            Crypto
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-[var(--foreground)] leading-tight">
                                        {marketInfo.question}
                                    </h1>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-[var(--card)] backdrop-blur-sm rounded-[24px] border border-[var(--border)] p-5">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Yes Probability</div>
                                    <div className="text-3xl font-serif text-[#4A6D4D]">{marketInfo.yesPercentage}%</div>
                                </div>
                                <div className="bg-[var(--card)] backdrop-blur-sm rounded-[24px] border border-[var(--border)] p-5">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">No Probability</div>
                                    <div className="text-3xl font-serif text-[#8B4A4A]">{(100 - parseFloat(marketInfo.yesPercentage)).toFixed(1)}%</div>
                                </div>
                                <div className="bg-[var(--card)] backdrop-blur-sm rounded-[24px] border border-[var(--border)] p-5">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Pool</div>
                                    <div className="text-3xl font-serif text-[var(--foreground)] flex items-baseline gap-1">
                                        {parseFloat(marketInfo.totalPool).toFixed(2)}
                                        <span className="text-xs font-sans text-[var(--muted)] opacity-60 ml-1">{assetConfig.symbol}</span>
                                    </div>
                                </div>
                                <div className="bg-[var(--card)] backdrop-blur-sm rounded-[24px] border border-[var(--border)] p-5">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Closes</div>
                                    <div className="text-xl font-serif text-[var(--foreground)] mt-2">{marketInfo.closesAt.toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Probability Bar */}
                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8">
                            <h3 className="font-serif text-xl text-[var(--foreground)] mb-6">Market Odds</h3>
                            <div className="h-4 bg-[#f9eeee] rounded-full overflow-hidden mb-3 border border-[#dcbbbb]/20">
                                <div
                                    className="h-full bg-[#4A6D4D] transition-all duration-700 ease-in-out"
                                    style={{ width: `${marketInfo.yesPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-sm uppercase tracking-wider font-bold">
                                <span className="text-[#4A6D4D]">Yes {marketInfo.yesPercentage}%</span>
                                <span className="text-[#8B4A4A]">No {(100 - parseFloat(marketInfo.yesPercentage)).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* User Position */}
                        {hasUserPredicted && (
                            <div className="bg-[rgba(148,116,147,0.05)] rounded-[32px] border border-[rgba(148,116,147,0.15)] p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
                                    <span className="font-serif text-xl text-[var(--foreground)]">Your Position</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-[rgba(255,255,255,0.6)] rounded-[24px] p-6 border border-[var(--borderSoft)]">
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Prediction</div>
                                        <div className={cn(
                                            "text-3xl font-serif",
                                            userChoice === 'YES' ? "text-[#4A6D4D]" : "text-[#8B4A4A]"
                                        )}>
                                            {userChoice}
                                        </div>
                                    </div>
                                    <div className="bg-[rgba(255,255,255,0.6)] rounded-[24px] p-6 border border-[var(--borderSoft)]">
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Staked</div>
                                        <div className="text-3xl font-serif text-[var(--foreground)]">
                                            {parseFloat(userPrediction?.yieldStaked || '0').toFixed(4)} <span className="text-sm text-[var(--muted)]">{assetConfig.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rules */}
                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8">
                            <h3 className="font-serif text-xl text-[var(--foreground)] mb-4">Rules</h3>
                            <p className="text-[var(--secondary)] text-sm leading-7 mb-6">
                                This market resolves to "Yes" if the condition specified in the market title is met by the closing date.
                                Resolution is determined by the market owner based on publicly verifiable information.
                            </p>
                            <div className="flex items-center gap-4 p-4 bg-[var(--surface-1)] rounded-[20px] border border-[var(--borderSoft)]">
                                <div>
                                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Contract Address</div>
                                    <a
                                        href={`https://sepolia.mantlescan.xyz/address/${address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--primary)] hover:opacity-80 text-sm flex items-center gap-2 font-mono"
                                    >
                                        {address.slice(0, 10)}...{address.slice(-8)}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Trading Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 sticky top-28 shadow-xl">
                            {isOpen ? (
                                <>
                                    {/* Current Position (if any) */}
                                    {hasUserPredicted && (
                                        <div className="mb-8 p-5 bg-[rgba(148,116,147,0.05)] rounded-[24px] border border-[rgba(148,116,147,0.1)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-4 h-4 text-[var(--primary)]" />
                                                <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Your Position</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={cn("font-serif text-lg", userChoice === 'YES' ? 'text-[#4A6D4D]' : 'text-[#8B4A4A]')}>
                                                    {userChoice}
                                                </span>
                                                <span className="text-[var(--foreground)] font-mono text-sm">
                                                    {parseFloat(userPrediction?.yieldStaked || '0').toFixed(4)} y{assetConfig.symbol}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="font-serif text-2xl text-[var(--foreground)] mb-6">
                                        {hasUserPredicted ? 'Add to Position' : 'Place Prediction'}
                                    </h3>

                                    {/* Yes/No Toggle */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <button
                                            onClick={() => setChoice('yes')}
                                            className={cn(
                                                "py-4 rounded-[20px] font-bold transition-all duration-300 relative overflow-hidden",
                                                choice === 'yes'
                                                    ? "bg-[#4A6D4D] text-white shadow-lg shadow-[#4A6D4D]/20 scale-[1.02]"
                                                    : "bg-[#4A6D4D]/10 text-[#4A6D4D] border border-[#4A6D4D]/30 hover:bg-[#4A6D4D]/20"
                                            )}
                                        >
                                            <span className="uppercase tracking-[0.2em] text-xs block mb-1">Yes</span>
                                            <span className="font-serif text-lg">{(yesPrice * 100).toFixed(0)}%</span>
                                        </button>
                                        <button
                                            onClick={() => setChoice('no')}
                                            className={cn(
                                                "py-4 rounded-[20px] font-bold transition-all duration-300 relative overflow-hidden",
                                                choice === 'no'
                                                    ? "bg-[#8B4A4A] text-white shadow-lg shadow-[#8B4A4A]/20 scale-[1.02]"
                                                    : "bg-[#8B4A4A]/10 text-[#8B4A4A] border border-[#8B4A4A]/30 hover:bg-[#8B4A4A]/20"
                                            )}
                                        >
                                            <span className="uppercase tracking-[0.2em] text-xs block mb-1">No</span>
                                            <span className="font-serif text-lg">{(noPrice * 100).toFixed(0)}%</span>
                                        </button>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3 font-bold">
                                            <span>Amount</span>
                                            <span>Available: {availableYieldValue.toFixed(4)}</span>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-[var(--surface-1)] border border-[var(--borderSoft)] rounded-[24px] px-6 py-4 text-3xl font-serif font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--muted)]/30 shadow-inner"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--muted)] font-bold text-sm pointer-events-none">
                                                y{assetConfig.symbol}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Amounts */}
                                    <div className="flex gap-2 mb-6">
                                        {[0.0001, 0.0005, 0.001].map((amt) => (
                                            <button
                                                key={amt}
                                                onClick={() => setAmount(amt.toString())}
                                                className="flex-1 py-2 text-xs font-bold uppercase tracking-wide bg-[var(--surface-1)] hover:bg-[var(--surface-2)] rounded-[16px] transition-colors text-[var(--secondary)] border border-[var(--borderSoft)]"
                                            >
                                                +{amt}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => {
                                                // Floor to 4 decimals to avoid rounding up causing insufficient yield
                                                const factor = 10000;
                                                const safeMax = Math.floor(availableYieldValue * factor) / factor;
                                                setAmount(safeMax.toString());
                                            }}
                                            className="flex-1 py-2 text-xs font-bold uppercase tracking-wide bg-[var(--surface-1)] hover:bg-[var(--surface-2)] rounded-[16px] transition-colors text-[var(--secondary)] border border-[var(--borderSoft)]"
                                        >
                                            Max
                                        </button>
                                    </div>

                                    {/* Potential Return Info */}
                                    <div className="mb-8 p-6 bg-[rgba(148,116,147,0.03)] rounded-[24px] border border-[rgba(148,116,147,0.08)]">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-[var(--secondary)]">Potential Return</span>
                                            <span className="text-lg font-bold text-[var(--primary)] font-serif">
                                                {potentialReturn > 0 ? `+${potentialReturn.toFixed(2)}` : '0.00'} {assetConfig.symbol}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[var(--muted)] text-right">
                                            (If outcome is {choice.toUpperCase()})
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePredict}
                                        disabled={!isConnected || isPending || isConfirming || amountValue <= 0 || amountValue > availableYieldValue}
                                        className={cn(
                                            "w-full py-4 rounded-[16px] font-bold text-lg transition-all shadow-[0_4px_20px_-4px_var(--primary-custom)_30] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest",
                                            !isConnected
                                                ? "bg-[var(--muted)]/20 text-[var(--muted)] cursor-not-allowed shadow-none"
                                                : amountValue <= 0 || amountValue > availableYieldValue
                                                    ? "bg-[var(--surface-2)] text-[var(--muted)] cursor-not-allowed shadow-none"
                                                    : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
                                        )}
                                    >
                                        {isPending ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                        ) : isConfirming ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
                                        ) : !isConnected ? (
                                            'Connect Wallet'
                                        ) : (
                                            `Predict ${choice.toUpperCase()}`
                                        )}
                                    </button>

                                    <p className="text-[10px] text-center text-[var(--muted)] mt-4 uppercase tracking-wider opacity-60">
                                        Your principal is always safe. Only yield is at risk.
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-[rgba(148,116,147,0.1)] text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-serif text-[var(--foreground)] mb-2">Market Closed</h3>
                                    <p className="text-[var(--secondary)] text-sm px-4">
                                        {isResolved ? 'This market has been resolved.' : 'Trading period has ended.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
