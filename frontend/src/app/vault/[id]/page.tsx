'use client';

import React, { useState } from 'react';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { ChevronRight, ShieldCheck, Copy, ExternalLink, Info, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TOKEN_ICONS } from '@/config/contracts';
import { ExposureDisplay, ExposureAsset } from '@/components/vault/ExposureDisplay';
import { useAsset } from '@/context/AssetContext';
import { useTokenBalance, useDepositInfo, useApproveToken, useDeposit, useFlashDeposit, useWithdraw, useTokenAllowance, useMintToken, useAvailableYield } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';

// Mock Chart Data
const DATA = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    apy: 2.5 + Math.random() * 0.5,
    tvl: 300 + i * 2 + Math.random() * 5
}));

type Tab = 'your-position' | 'overview' | 'performance' | 'risk' | 'activity';

// YieldEdge real vault IDs
const REAL_VAULT_IDS = ['yieldedge-usdy', 'yieldedge-meth'];

export default function VaultDetailsPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [isFlashMode, setIsFlashMode] = useState(false);
    const [lockDuration, setLockDuration] = useState(30);
    const [activeSection, setActiveSection] = useState<Tab>('performance');

    const { currentAsset, assetConfig, setAsset } = useAsset();
    const { isConnected } = useAccount();
    const { data: balance, refetch: refetchBalance } = useTokenBalance();
    const { data: depositInfo, refetch: refetchDeposit } = useDepositInfo();
    const { data: allowance, refetch: refetchAllowance } = useTokenAllowance();
    const { data: availableYield } = useAvailableYield();

    // Deposit/withdraw hooks
    const { approve, isPending: isApproving, isConfirming: isApprovingConfirm, isSuccess: approveSuccess } = useApproveToken();
    const { deposit, isPending: isDepositing, isConfirming: isDepositingConfirm, isSuccess: depositSuccess } = useDeposit();
    const { flashDeposit, isPending: isFlashDepositing, isConfirming: isFlashConfirming, isSuccess: flashSuccess } = useFlashDeposit();
    const { withdraw, isPending: isWithdrawing, isConfirming: isWithdrawingConfirm, isSuccess: withdrawSuccess } = useWithdraw();
    const { mint, isPending: isMinting, isSuccess: mintSuccess } = useMintToken();

    // Check if this is a real YieldEdge vault
    const isRealVault = REAL_VAULT_IDS.includes(params.id);

    // Auto-switch asset based on vault ID
    React.useEffect(() => {
        if (params.id === 'yieldedge-usdy') {
            setAsset('usdy');
        } else if (params.id === 'yieldedge-meth') {
            setAsset('meth');
        }
    }, [params.id, setAsset]);

    // Derived values
    const symbol = assetConfig.symbol;
    const displayBalance = balance ? parseFloat(formatEther(balance)).toFixed(2) : '0.00';
    const displayPosition = depositInfo?.currentValue ? parseFloat(depositInfo.currentValue).toFixed(2) : '0.00';
    const isPending = isApproving || isDepositing || isWithdrawing || isApprovingConfirm || isDepositingConfirm || isWithdrawingConfirm || isFlashDepositing || isFlashConfirming;

    // Check if approval is needed based on current allowance and input amount
    const exposureAssets: ExposureAsset[] = currentAsset === 'meth'
        ? [
            { symbol: 'weETH', icon: TOKEN_ICONS.weETH, amount: '$45.00M', percentage: 45, color: '#3b82f6' },
            { symbol: 'wstETH', icon: TOKEN_ICONS.wstETH, amount: '$27.61M', percentage: 28, color: '#6366f1' },
            { symbol: 'WETH', icon: TOKEN_ICONS.WETH, amount: '$20.00M', percentage: 20, color: '#8b5cf6', isIdle: true },
            { symbol: 'mETH', icon: TOKEN_ICONS.WETH, amount: '$10.00M', percentage: 7, color: '#ec4899' },
        ]
        : [
            { symbol: 'USDC', icon: TOKEN_ICONS.USDC, amount: '$160.5M', percentage: 60, color: '#2775ca' },
            { symbol: 'sUSDS', icon: TOKEN_ICONS.sUSDS, amount: '$53.5M', percentage: 20, color: '#16a34a' },
            { symbol: 'wsrUSD', icon: TOKEN_ICONS.wsrUSD, amount: '$26.7M', percentage: 10, color: '#f59e0b' },
            { symbol: 'sUSDe', icon: TOKEN_ICONS.sUSDe, amount: '$26.7M', percentage: 10, color: '#000000' },
        ];

    const amountWei = amount ? BigInt(Math.floor(parseFloat(amount || '0') * 1e18)) : BigInt(0);
    const needsApproval = !allowance || (allowance as bigint) < amountWei;

    // Handle approval success - refetch allowance
    React.useEffect(() => {
        if (approveSuccess) {
            refetchAllowance();
            toast.success('Approval successful!', {
                description: `${symbol} approved for deposit`
            });
        }
    }, [approveSuccess, symbol, refetchAllowance]);

    // Handle deposit success
    React.useEffect(() => {
        if (depositSuccess) {
            setAmount('');
            refetchBalance();
            refetchDeposit();
            toast.success('Deposit successful!', {
                description: `Your ${symbol} has been deposited to the vault`
            });
        }
    }, [depositSuccess, refetchBalance, refetchDeposit, symbol]);

    // Handle flash deposit success
    React.useEffect(() => {
        if (flashSuccess) {
            setAmount('');
            refetchBalance();
            refetchDeposit();
            toast.success('Flash Deposit successful!', {
                description: `You've locked ${symbol} and received instant yield!`
            });
        }
    }, [flashSuccess, refetchBalance, refetchDeposit, symbol]);

    // Handle withdraw success
    React.useEffect(() => {
        if (withdrawSuccess) {
            setAmount('');
            refetchBalance();
            refetchDeposit();
            toast.success('Withdrawal successful!', {
                description: `Your ${symbol} has been withdrawn from the vault`
            });
        }
    }, [withdrawSuccess, refetchBalance, refetchDeposit, symbol]);

    // Handle mint success
    React.useEffect(() => {
        if (mintSuccess) {
            refetchBalance();
            toast.success('Mint successful!', {
                description: `Received 1000 ${symbol} for testing`
            });
        }
    }, [mintSuccess, refetchBalance, symbol]);

    const handleAction = () => {
        if (activeTab === 'withdraw') {
            withdraw();
            return;
        }

        if (!amount || parseFloat(amount) <= 0) return;

        if (needsApproval) {
            const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
            approve(amountWei);
        } else {
            if (isFlashMode) {
                flashDeposit(amount, lockDuration);
            } else {
                deposit(amount);
            }
        }
    };

    return (
        <main className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] pb-20">
            {/* Header Navigation */}
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

            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1440px]">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-8 uppercase tracking-widest font-bold text-[10px]">
                    <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Vaults</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[var(--foreground)] font-bold">{assetConfig.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* LEFT COLUMN: Main Info */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Vault Title Header */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                {assetConfig.icon ? (
                                    <img src={assetConfig.icon} alt={assetConfig.symbol} className="w-20 h-20 rounded-full shadow-lg bg-white p-0.5 border border-[var(--borderSoft)]" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-3xl font-serif font-bold italic shadow-lg">
                                        {assetConfig.symbol[0]}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-[var(--foreground)] leading-tight">{assetConfig.name}</h1>
                                        <Badge variant="secondary" className="bg-[rgba(148,116,147,0.1)] text-[var(--primary)] border-[rgba(148,116,147,0.3)] rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wide">V2</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--secondary)] mt-2">
                                        <span className="text-xs uppercase tracking-wider font-medium">Curated by</span>
                                        <span className="flex items-center gap-2 font-serif text-[var(--foreground)] font-medium">
                                            <div className="w-6 h-6 rounded-full bg-[var(--surface-1)] border border-[var(--borderSoft)] flex items-center justify-center text-[10px] font-bold text-[var(--foreground)] shadow-sm">S</div>
                                            Steakhouse Financial <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Yield Stats Card */}
                            <div className="bg-[#302A30] rounded-[24px] p-6 mb-6 text-[#E1D9CB] grid grid-cols-2 gap-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] opacity-10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Available y{symbol}</div>
                                    <div className="text-4xl font-serif font-bold flex items-center gap-2 text-[#C8A166]">
                                        <Sparkles className="w-5 h-5" />
                                        {availableYield ? parseFloat(availableYield).toFixed(4) : '0.0000'}
                                    </div>
                                    <div className="text-[10px] text-[var(--muted)] mt-1 font-medium bg-[rgba(255,255,255,0.05)] inline-block px-2 py-0.5 rounded-full">Betting Power</div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Boosted APY</div>
                                    <div className="text-4xl font-serif font-bold text-[#4A6D4D]">50.00%</div>
                                    <div className="text-[10px] text-[var(--muted)] mt-1 font-medium bg-[rgba(255,255,255,0.05)] inline-block px-2 py-0.5 rounded-full">Instant Yield Active</div>
                                </div>
                            </div>

                            {/* Big Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                                <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)] backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Total Deposits</div>
                                    <div className="text-2xl font-serif text-[var(--foreground)]">$381.75<span className="text-sm text-[var(--muted)]">M</span></div>
                                    <div className="text-[10px] text-[var(--secondary)] mt-1 font-mono">381.78M USDC</div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)] backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Liquidity</div>
                                    <div className="text-2xl font-serif text-[var(--foreground)]">$62.90<span className="text-sm text-[var(--muted)]">M</span></div>
                                    <div className="text-[10px] text-[var(--secondary)] mt-1 font-mono">62.91M USDC</div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)] backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Exposure</div>
                                    <div className="mt-2">
                                        <ExposureDisplay assets={exposureAssets} />
                                    </div>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)] backdrop-blur-sm">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1 flex items-center gap-1">
                                        APY <Info className="w-3 h-3 text-[var(--muted)]" />
                                    </div>
                                    <div className="text-2xl font-serif text-[var(--foreground)] flex items-center gap-2">
                                        4.82<span className="text-sm">%</span>
                                        {/* Sparkles Icon */}
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--primary)]">
                                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" fillOpacity="0.5" />
                                            <path d="M18 18L19 21L22 22L19 23L18 26L17 23L14 22L17 21L18 18Z" fill="currentColor" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="border-b border-[var(--border)]">
                            <nav className="flex items-center gap-8" aria-label="Tabs">
                                {[
                                    { id: 'your-position', label: 'Your Position' },
                                    { id: 'overview', label: 'Overview' },
                                    { id: 'performance', label: 'Performance' },
                                    { id: 'risk', label: 'Risk' },
                                    { id: 'activity', label: 'Activity' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id as Tab)}
                                        className={cn(
                                            "py-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                                            activeSection === tab.id
                                                ? "text-[var(--foreground)] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[var(--foreground)]"
                                                : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content Area */}
                        <div className="min-h-[400px]">

                            {/* Your Position Tab */}
                            {activeSection === 'your-position' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-sm text-[var(--muted)] font-bold uppercase tracking-widest mb-2">My Deposit</div>
                                                <div className="text-5xl font-serif font-medium text-[var(--foreground)] tracking-tight">
                                                    {depositInfo?.currentValue ? parseFloat(depositInfo.currentValue).toFixed(2) : '0.00'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="text-[var(--secondary)] border-[var(--borderSoft)] bg-white/20">{symbol}</Badge>
                                            </div>
                                        </div>

                                        {/* Position Details */}
                                        {depositInfo && parseFloat(depositInfo.principal) > 0 && (
                                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-5 border border-[var(--borderSoft)]">
                                                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">Principal</div>
                                                    <div className="text-xl font-serif text-[var(--foreground)]">
                                                        {parseFloat(depositInfo.principal).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[rgba(74,109,77,0.05)] rounded-2xl p-5 border border-[rgba(74,109,77,0.1)]">
                                                    <div className="text-[10px] text-[rgba(74,109,77,0.8)] uppercase tracking-wider mb-1">Unlocked Yield</div>
                                                    <div className="text-xl font-serif text-[rgba(74,109,77,1)]">
                                                        {parseFloat(depositInfo.unlockedYield) >= 0 ? '+' : ''}{parseFloat(depositInfo.unlockedYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[rgba(200,161,102,0.1)] rounded-2xl p-5 border border-[rgba(200,161,102,0.2)]">
                                                    <div className="text-[10px] text-[var(--gold)] uppercase tracking-wider mb-1">Locked Yield</div>
                                                    <div className="text-xl font-serif text-[var(--gold)]">
                                                        {parseFloat(depositInfo.lockedYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[rgba(148,116,147,0.1)] rounded-2xl p-5 border border-[rgba(148,116,147,0.2)]">
                                                    <div className="text-[10px] text-[var(--primary)] uppercase tracking-wider mb-1">Total Yield</div>
                                                    <div className="text-xl font-serif text-[var(--primary)]">
                                                        {parseFloat(depositInfo.totalYield) >= 0 ? '+' : ''}{parseFloat(depositInfo.totalYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {(!depositInfo || parseFloat(depositInfo.principal) === 0) && (
                                            <div className="mt-8 text-center py-8 text-[var(--muted)]">
                                                <p className="mb-4">No deposits yet. Deposit to start earning yield!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Featured Markets - Quick Bet */}
                                    {depositInfo && parseFloat(depositInfo.unlockedYield || '0') > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-serif font-medium text-[var(--foreground)] flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                                                    Featured Markets <Badge variant="secondary" className="bg-[var(--gold)]/20 text-[var(--gold)] text-[10px]">HOT</Badge>
                                                </h3>
                                                <Link href="/" className="text-sm text-[var(--primary)] hover:underline sans-serif">View All Markets</Link>
                                            </div>
                                            <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-6 shadow-sm">
                                                <p className="text-sm text-[var(--secondary)] mb-4">Use your <span className="font-serif font-semibold text-[var(--gold)]">{parseFloat(depositInfo.unlockedYield || '0').toFixed(4)} y{symbol}</span> yield to bet:</p>
                                                <div className="space-y-3">
                                                    {/* Market 1: BTC > $100k */}
                                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[rgba(200,161,102,0.1)] to-transparent rounded-2xl border border-[rgba(200,161,102,0.2)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold text-sm">₿</div>
                                                            <div>
                                                                <div className="font-serif font-medium text-[var(--foreground)]">BTC &gt; $100k by Jan 2026?</div>
                                                                <div className="text-[10px] text-[var(--gold)] font-bold uppercase tracking-wider">🔥 Hot • 50% YES</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link href="/markets/0xa188527c4a95f0a413d3cb91c48c3d7be8745aaa" className="px-5 py-2 bg-[#4A6D4D] hover:bg-[#3A5D3D] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all">YES</Link>
                                                            <Link href="/markets/0xa188527c4a95f0a413d3cb91c48c3d7be8745aaa" className="px-5 py-2 bg-[#944D4D] hover:bg-[#843D3D] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all">NO</Link>
                                                        </div>
                                                    </div>
                                                    {/* Market 2: ETH > $5k */}
                                                    <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-[var(--borderSoft)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#627eea] flex items-center justify-center text-white font-bold text-sm">Ξ</div>
                                                            <div>
                                                                <div className="font-serif font-medium text-[var(--foreground)]">ETH &gt; $5,000 by Mar 2026?</div>
                                                                <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">50% YES</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link href="/markets/0x208a4954a9f35f8be65a945b995a8670cbfe3ca4" className="px-5 py-2 bg-[#4A6D4D] hover:bg-[#3A5D3D] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all">YES</Link>
                                                            <Link href="/markets/0x208a4954a9f35f8be65a945b995a8670cbfe3ca4" className="px-5 py-2 bg-[#944D4D] hover:bg-[#843D3D] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all">NO</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* No Yield - Prompt to Deposit */}
                                    {depositInfo && parseFloat(depositInfo.unlockedYield || '0') === 0 && parseFloat(depositInfo.principal || '0') > 0 && (
                                        <div className="bg-[rgba(148,116,147,0.1)] border border-[rgba(148,116,147,0.2)] rounded-2xl p-5">
                                            <div className="flex items-center gap-2 text-[var(--primary)] text-sm">
                                                <Info className="w-4 h-4" />
                                                <span>Enable <span className="font-serif font-semibold">Instant Power</span> to get yield instantly and participate in prediction markets!</span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-serif font-medium text-[var(--foreground)]">Your transactions</h3>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 text-center text-[var(--muted)] min-h-[200px] flex items-center justify-center">
                                            <div>
                                                <p className="font-serif italic">Transaction history coming soon.</p>
                                                <p className="text-xs mt-2 uppercase tracking-wider">View on <a href={`https://sepolia.mantlescan.xyz/address/${assetConfig.vault}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline decoration-dotted underline-offset-4">Mantle Explorer</a></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overview Tab */}
                            {activeSection === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Total Deposits Chart Card */}
                                    <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <div className="text-xs text-[var(--muted)] font-bold uppercase tracking-widest mb-1">Total Deposits (USD)</div>
                                                <div className="text-4xl font-serif font-medium text-[var(--foreground)] tracking-tight">$381.75<span className="text-xl text-[var(--muted)]">M</span></div>
                                            </div>
                                            <div className="flex bg-[var(--surface-1)] rounded-full p-1 border border-[var(--borderSoft)]">
                                                {['USDC', 'USD'].map(t => <button key={t} className={`text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all ${t === 'USD' ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>{t}</button>)}
                                                <div className="w-px bg-[var(--border)] mx-1 h-3 self-center"></div>
                                                <button className="text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full text-[var(--foreground)] bg-white shadow-sm">3 months</button>
                                            </div>
                                        </div>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={DATA}>
                                                    <defs>
                                                        <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#947493" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#947493" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="day" hide />
                                                    <YAxis hide domain={['dataMin', 'dataMax']} />
                                                    <Area type="monotone" dataKey="tvl" stroke="#947493" strokeWidth={2} fill="url(#colorTvl)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* APY & Breakdown Split */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-sm">
                                            <div className="mb-6">
                                                <div className="flex items-center gap-1 text-xs text-[var(--muted)] font-bold uppercase tracking-widest mb-1">APY <span className="text-[var(--primary)]">✨</span></div>
                                                <div className="text-4xl font-serif font-medium text-[var(--foreground)] tracking-tight">4.82%</div>
                                            </div>
                                            <div className="h-[200px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={DATA}>
                                                        <defs>
                                                            <linearGradient id="colorApy2" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#947493" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#947493" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area type="monotone" dataKey="apy" stroke="#947493" strokeWidth={2} fill="url(#colorApy2)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-white/40 rounded-[32px] border border-[var(--borderSoft)] p-8 space-y-6 backdrop-blur-sm">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--secondary)]">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>
                                                    </div>
                                                    <span className="font-medium text-[var(--foreground)]">Native APY</span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">4.54%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[rgba(148,116,147,0.1)] flex items-center justify-center text-[var(--primary)]">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                                    </div>
                                                    <span className="font-medium text-[var(--foreground)]">MORPHO <ExternalLink className="inline w-3 h-3 ml-1 text-[var(--muted)]" /></span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">+0.27%</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-[var(--muted)]">
                                                        $
                                                    </div>
                                                    <span className="font-medium text-[var(--foreground)]">Performance Fee <span className="bg-[var(--surface-1)] text-[10px] px-1.5 py-0.5 rounded ml-1">0%</span></span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">0.00%</span>
                                            </div>
                                            <div className="pt-6 border-t border-[var(--borderSoft)] flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-[var(--primary)] font-medium">
                                                    <span className="text-[var(--primary)]">✨</span> Net APY
                                                </div>
                                                <span className="font-serif font-bold text-[var(--primary)] text-xl">= 4.82%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Exposure Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-serif font-medium text-[var(--foreground)]">Market Exposure</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs uppercase tracking-widest text-[var(--muted)]">Breakdown</span>
                                                <ExposureDisplay assets={exposureAssets} />
                                            </div>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/30 border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider text-[10px]">
                                                    <tr>
                                                        <th className="px-8 py-5 text-left">Asset</th>
                                                        <th className="px-8 py-5 text-left">Protocol</th>
                                                        <th className="px-8 py-5 text-right">Allocation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--borderSoft)]">
                                                    {exposureAssets.map((asset, i) => (
                                                        <tr key={i} className="hover:bg-white/20 transition-colors">
                                                            <td className="px-8 py-5 flex items-center gap-4">
                                                                <img src={asset.icon} alt={asset.symbol} className="w-8 h-8 rounded-full border border-white" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-serif font-medium text-[var(--foreground)]">{asset.symbol}</span>
                                                                    {asset.isIdle && <span className="text-[10px] text-[var(--muted)] uppercase">Idle Assets</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-[var(--secondary)]">Morpho {currentAsset === 'meth' ? 'Blue' : 'Rewards'}</td>
                                                            <td className="px-8 py-5 text-right font-serif font-medium text-[var(--foreground)]">{asset.percentage}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Performance Tab */}
                            {activeSection === 'performance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Chart Section */}
                                    <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-sm">
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={DATA}>
                                                    <defs>
                                                        <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#947493" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#947493" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="day" hide />
                                                    <YAxis hide domain={['dataMin', 'dataMax']} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px -1px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)' }}
                                                        cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
                                                    />
                                                    <Area type="monotone" dataKey="apy" stroke="#947493" strokeWidth={3} fillOpacity={1} fill="url(#colorApy)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Returns Grid */}
                                    <div>
                                        <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mb-6">Returns</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <div className="flex items-center gap-2 text-[var(--secondary)]">
                                                    Instant APY <Info className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex items-center gap-2 font-serif font-medium text-[var(--foreground)] text-lg">
                                                    4.84% <span className="text-[var(--primary)]">✨</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--secondary)]">7D APY</span>
                                                <span className="font-serif font-medium text-[var(--foreground)] text-lg">4.16%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--secondary)]">30D APY</span>
                                                <span className="font-serif font-medium text-[var(--foreground)] text-lg">3.89%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--secondary)]">90D APY</span>
                                                <span className="font-serif font-medium text-[var(--foreground)] text-lg">4.23%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--secondary)]">Performance Fee</span>
                                                <span className="font-serif font-medium text-[var(--foreground)] text-lg">0.00%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--secondary)]">Fee Recipient</span>
                                                <div className="flex items-center gap-2 text-[var(--foreground)]">
                                                    <span className="font-mono text-sm">0x255c...085a</span>
                                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)] cursor-pointer hover:text-[var(--primary)]" />
                                                    <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)] cursor-pointer hover:text-[var(--primary)]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Risk Tab */}
                            {activeSection === 'risk' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                    <div>
                                        <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mb-6">Risk Disclosures</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                                            {[
                                                { label: 'Curator TVL', value: '$1.55B' },
                                                { label: 'Vault Deployment Date', value: '2024-01-04' },
                                                { label: 'Owner', value: 'SAFE 5/8', icon: true },
                                                { label: 'Curator', value: 'SAFE 2/5', icon: true },
                                                { label: 'Guardian', value: 'Aragon DAO', icon: true },
                                                { label: 'Morpho Vault Version', value: 'v1.0' },
                                                { label: 'Timelock Duration', value: '7 days' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center py-4 border-b border-[var(--borderSoft)]">
                                                    <span className="text-[var(--secondary)]">{item.label}</span>
                                                    <div className="flex items-center gap-2 font-serif font-medium text-[var(--foreground)]">
                                                        {item.icon && <div className="w-4 h-4 rounded-full bg-[#4A6D4D]"></div>}
                                                        {item.value}
                                                        {item.icon && <ExternalLink className="w-3 h-3 text-[var(--muted)]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Market Risk Disclosures */}
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)] mb-2 flex items-center gap-2">
                                            Market Risk Disclosures <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
                                        </h4>
                                        <div className="bg-[var(--surface-1)] rounded-xl p-6 text-sm text-[var(--secondary)] leading-relaxed border border-[var(--borderSoft)] font-serif italic">
                                            Steakhouse (incl. Prime) Vaults are designed to minimize volatility by programmatically allocating against highly-liquid assets. While Steakhouse Vaults are focused on established markets, no strategy eliminates risk entirely.
                                        </div>
                                    </div>

                                    {/* Ratings & Risk Curation */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div>
                                            <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mb-6 flex items-center gap-2">Ratings <Info className="w-4 h-4 text-[var(--muted)]" /></h3>
                                            <div className="bg-[var(--card)] backdrop-blur-md rounded-[24px] border border-[var(--border)] p-6 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Risk Score</div>
                                                    <div className="text-4xl font-serif font-bold text-[var(--foreground)]">A</div>
                                                </div>
                                                <div className="h-12 w-12 bg-[var(--surface-2)] rounded-full flex items-center justify-center border border-[var(--borderSoft)]">
                                                    <ExternalLink className="w-5 h-5 text-[var(--muted)]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mb-6">Risk Curation</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Allocator Address', type: 'Public Allocator', addr: '0xfd32...c75D' },
                                                    { label: 'Allocator Address', type: '', addr: '0x9E91...f9e1' },
                                                    { label: 'Allocator Address', type: '', addr: '0xfeed...3C9a' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[var(--secondary)]">{item.label}</span>
                                                            {item.type && <Badge variant="secondary" className="text-[10px] bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--borderSoft)]">{item.type}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[var(--foreground)] font-mono text-sm">
                                                            {item.addr} <Copy className="w-3 h-3 text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeSection === 'activity' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                    {/* User Distribution */}
                                    <div>
                                        <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mb-6">User Distribution</h3>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/30 border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider text-[10px]">
                                                    <tr>
                                                        <th className="px-8 py-5 text-left">User</th>
                                                        <th className="px-8 py-5 text-left">Deposit</th>
                                                        <th className="px-8 py-5 text-right">% of Deposits</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--borderSoft)]">
                                                    {[
                                                        { user: '0x9390...A1D1', deposit: '193,264,429.49 USDC', val: '$193.24M', pct: '50.62%' },
                                                        { user: '0x334F...2A7b', deposit: '32,474,724.04 USDC', val: '$32.47M', pct: '8.50%' },
                                                        { user: '0x1870...a12e', deposit: '30,230,513.23 USDC', val: '$30.22M', pct: '7.91%' },
                                                        { user: '0xD1A1...c1BC', deposit: '9,744,946.2 USDC', val: '$9.74M', pct: '2.55%' },
                                                    ].map((row, i) => (
                                                        <tr key={i} className="hover:bg-white/20 transition-colors">
                                                            <td className="px-8 py-5 font-mono text-[var(--secondary)] flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--gold)]`}></div>
                                                                {row.user}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className="font-serif font-medium text-[var(--foreground)]">{row.deposit}</span>
                                                                <Badge variant="secondary" className="ml-2 bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--borderSoft)] font-normal">{row.val}</Badge>
                                                            </td>
                                                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2 text-[var(--foreground)] font-serif">
                                                                <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
                                                                {row.pct}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* All Transactions */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-serif font-medium text-[var(--foreground)]">All transactions</h3>
                                            <div className="flex gap-2">
                                                <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)]">
                                                    <ChevronRight className="w-3 h-3 rotate-90" /> All
                                                </button>
                                                <Badge variant="secondary" className="bg-[var(--surface-2)] hover:bg-[var(--surface-1)] text-[var(--secondary)] cursor-pointer text-[10px] uppercase tracking-wide">Customize</Badge>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/30 border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider text-[10px]">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left">Date</th>
                                                        <th className="px-6 py-4 text-left">Type</th>
                                                        <th className="px-6 py-4 text-left">Amount</th>
                                                        <th className="px-6 py-4 text-left">User</th>
                                                        <th className="px-6 py-4 text-right">Transaction</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--borderSoft)]">
                                                    {[
                                                        { date: '2026-01-02 18:17:23', type: 'Vault Deposit', amount: '6,257.11 USDC', val: '$6256.63', user: '0x251c...3A75' },
                                                        { date: '2026-01-02 18:10:59', type: 'Vault Deposit', amount: '2,350 USDC', val: '$2349.81', user: '0x334F...2A7b' },
                                                        { date: '2026-01-02 17:45:47', type: 'Vault Withdraw', amount: '1.05 USDC', val: '$1.05', user: '0x3ecB...E614' },
                                                    ].map((row, i) => (
                                                        <tr key={i} className="hover:bg-white/20 transition-colors">
                                                            <td className="px-6 py-4 text-[var(--muted)] whitespace-nowrap font-mono text-xs">{row.date}</td>
                                                            <td className="px-6 py-4 font-serif font-medium text-[var(--foreground)] whitespace-nowrap">{row.type}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0"></div>
                                                                    <span className="font-serif font-medium text-[var(--foreground)] whitespace-nowrap">{row.amount}</span>
                                                                    <Badge variant="secondary" className="bg-[var(--surface-2)] text-[var(--muted)] text-[10px] whitespace-nowrap border border-[var(--borderSoft)]">{row.val}</Badge>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-mono text-[var(--secondary)] whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{row.user}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono text-[var(--primary)] whitespace-nowrap underline decoration-dotted underline-offset-4">0x8e7...</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Fallback for other sections just in case, though all are covered now */}
                            {!['your-position', 'overview', 'performance', 'risk', 'activity'].includes(activeSection) && (
                                <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--muted)]">
                                    <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4 border border-[var(--borderSoft)]">
                                        <Info className="w-8 h-8 text-[var(--muted)]" />
                                    </div>
                                    <p className="font-serif italic">Content for {activeSection} is coming soon.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Interaction Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Deposit / Withdraw Card */}
                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-sm sticky top-24">
                            {isRealVault ? (
                                <>
                                    {/* Tabs */}
                                    <div className="flex bg-[var(--surface-1)] p-1 rounded-full mb-8 border border-[var(--borderSoft)]">
                                        <button
                                            onClick={() => setActiveTab('deposit')}
                                            className={cn(
                                                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all",
                                                activeTab === 'deposit' ? "bg-[var(--primary)] text-white shadow-md transform scale-105" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('withdraw')}
                                            className={cn(
                                                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all",
                                                activeTab === 'withdraw' ? "bg-[var(--primary)] text-white shadow-md transform scale-105" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            Withdraw
                                        </button>
                                    </div>

                                    {/* Input Area */}
                                    <div className="space-y-4 mb-8">
                                        <div className="bg-white/40 rounded-2xl p-6 border border-[var(--borderSoft)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all">
                                            <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 font-bold">
                                                <span>{activeTab === 'deposit' ? 'Amount' : 'Position'}</span>
                                                <span>
                                                    {activeTab === 'deposit'
                                                        ? `Balance: ${displayBalance} ${symbol}`
                                                        : `Holdings: ${displayPosition} p${symbol}`
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="bg-transparent text-4xl font-serif font-medium text-[var(--foreground)] flex-1 min-w-0 focus:outline-none placeholder:text-[var(--muted)]/30"
                                                />
                                                <div className="flex items-center gap-2 bg-[var(--surface-1)] px-3 py-1.5 rounded-full border border-[var(--borderSoft)] shadow-sm flex-shrink-0">
                                                    <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex-shrink-0"></div>
                                                    <span className="text-xs font-bold text-[var(--foreground)] whitespace-nowrap uppercase tracking-wider">
                                                        {activeTab === 'deposit' ? symbol : `p${symbol}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ⚡️ Flash Yield Option */}
                                    {activeTab === 'deposit' && (
                                        <div className="mb-8 p-6 rounded-[24px] border border-[var(--gold)]/30 bg-[var(--gold)]/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[var(--gold)]/20 transition-all"></div>
                                            <div className="flex items-center justify-between mb-4 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-serif font-bold text-[var(--foreground)] flex items-center gap-1">
                                                        <span className="text-lg">⚡️</span> Instant Power
                                                    </span>
                                                    <Badge className="bg-[var(--gold)] text-white border-none text-[10px] px-2 py-0.5 shadow-sm">NEW</Badge>
                                                </div>
                                                <div onClick={() => setIsFlashMode(!isFlashMode)} className={cn(
                                                    "w-12 h-7 rounded-full relative cursor-pointer transition-colors duration-300 ease-in-out border border-[var(--borderSoft)]",
                                                    isFlashMode ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-[var(--surface-2)]"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm",
                                                        isFlashMode ? "translate-x-5" : "translate-x-0"
                                                    )} />
                                                </div>
                                            </div>

                                            {isFlashMode && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 relative z-10">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3 block flex justify-between items-center">
                                                            <span>Lock Period</span>
                                                            <span className="text-[var(--primary)] font-serif text-lg">{lockDuration} Days</span>
                                                        </label>
                                                        <input
                                                            type="range" min="7" max="365" value={lockDuration}
                                                            onChange={(e) => setLockDuration(Number(e.target.value))}
                                                            className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)] hover:accent-[var(--primary)]/80 transition-all"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-[var(--muted)] mt-2 font-medium tracking-wide">
                                                            <span>7d</span>
                                                            <span>365d</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-[var(--surface-1)]/50 border border-[var(--border)] rounded-xl p-4 shadow-sm backdrop-blur-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider">Receive Instantly</span>
                                                            <span className="text-lg font-serif font-medium text-[var(--primary)]">
                                                                +${((parseFloat(amount) || 0) * 0.50 * lockDuration / 365).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-[var(--muted)] mt-1 text-right font-medium">
                                                            Based on 50% Instant Yield Rate
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Projection */}
                                    <div className="space-y-3 mb-8">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-[var(--secondary)]">Projected Monthly Earnings</span>
                                            <span className="font-serif font-medium text-[var(--foreground)] text-base">$0.00</span>
                                        </div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-[var(--secondary)]">Projected Yearly Earnings</span>
                                            <span className="font-serif font-medium text-[var(--foreground)] text-base">$0.00</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={handleAction}
                                        disabled={isPending || !amount || parseFloat(amount) <= 0}
                                        className="w-full py-4 rounded-[16px] bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:bg-[var(--muted)]/20 disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[var(--primary-foreground)] font-bold text-lg transition-all shadow-[0_4px_20px_-4px_var(--primary-custom)_30] active:scale-[0.98] uppercase tracking-widest"
                                    >
                                        {(isApproving || isDepositing || isWithdrawing) ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (isApprovingConfirm || isDepositingConfirm || isWithdrawingConfirm) ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Confirming...
                                            </span>
                                        ) : activeTab === 'deposit' ? (
                                            needsApproval ? `Approve ${symbol}` : (isFlashMode ? `Lock & Flash Deposit` : `Supply ${symbol}`)
                                        ) : (
                                            `Withdraw ${symbol}`
                                        )}
                                    </button>

                                    <p className="text-xs text-center text-[var(--muted)] mt-6 leading-relaxed">
                                        By using this vault, you agree to the <span className="underline cursor-pointer hover:text-[var(--foreground)] transition-colors">Terms of Service</span> and understand the risks involved.
                                    </p>
                                </>
                            ) : (
                                /* Mock Vault - Coming Soon State */
                                <div className="py-8 text-center space-y-6">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="text-sm font-medium text-[var(--secondary)] flex items-center gap-2 uppercase tracking-wider">
                                            <Sparkles className="w-4 h-4 text-[var(--gold)]" /> Available y{symbol}
                                        </div>
                                        <div className="text-4xl font-serif font-medium text-[var(--foreground)]">
                                            ${Number(availableYield).toFixed(4)}
                                        </div>
                                        <div className="text-xs text-[var(--muted)] font-medium">
                                            Risk-free betting power
                                        </div>
                                    </div>
                                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-bold text-sm uppercase tracking-widest rounded-full transition-colors">
                                        View Active Vaults
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Additional Info Card */}
                        <div className="bg-[var(--primary)]/5 rounded-[24px] border border-[var(--primary)]/10 p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <Info className="w-5 h-5 text-[var(--primary)] mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[var(--foreground)] text-sm mb-2">About Steakhouse USDC</h4>
                                    <p className="text-xs text-[var(--secondary)] leading-relaxed">
                                        This vault optimizes yield by allocating USDC to whitelisted lending markets on Morpho. It is curated by Steakhouse Financial, focusing on high-quality collateral.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}
