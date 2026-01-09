'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Search, SlidersHorizontal, Wallet, TrendingUp, AlertCircle, ShieldCheck, Flame, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useDepositInfo, useTokenBalance, useCurrentAssetContracts } from '@/hooks/useYieldEdge';
import { useAsset } from '@/context/AssetContext';
import { formatEther } from 'viem';
import { TOKEN_ICONS } from '@/config/contracts';
import { ExposureDisplay, ExposureAsset } from '@/components/vault/ExposureDisplay';

// Mock Vaults Data (for "Vaults" tab)
const VAULTS_DATA = [
    {
        id: 'yieldedge-usdy',
        name: 'YieldEdge USDY',
        iconUrl: TOKEN_ICONS.USDC,
        asset: 'usdy',
        deposits: { amount: '1.25M', asset: 'USDY', usd: '$1.25M' },
        liquidity: { amount: '0.85M', asset: 'USDY', usd: '$0.85M' },
        curator: { name: 'YieldEdge', isVerified: true },
        exposureAssets: [
            { symbol: 'USDC', icon: TOKEN_ICONS.USDC, amount: '$0.75M', percentage: 60, color: '#2775ca' },
            { symbol: 'sUSDS', icon: TOKEN_ICONS.sUSDS, amount: '$0.50M', percentage: 40, color: '#16a34a' }
        ],
        apy: { value: '50.00%', isHigh: true },
        isLive: true,
    },
    {
        id: 'strategy-btc',
        name: 'BTC Bull Strategy',
        iconUrl: TOKEN_ICONS.WBTC,
        asset: 'usdy',
        deposits: { amount: '50K', asset: 'USDY', usd: '$50K' },
        liquidity: { amount: '∞', asset: 'USDY', usd: '∞' },
        curator: { name: 'YieldEdge', isVerified: true },
        exposureAssets: [
            { symbol: 'USDY', icon: TOKEN_ICONS.USDC, amount: 'Principal', percentage: 95, color: '#2775ca' },
            { symbol: 'BTC Call', icon: TOKEN_ICONS.WBTC, amount: 'Yield', percentage: 5, color: '#f7931a' }
        ],
        apy: { value: '15%~500%', isHigh: true },
        isLive: true,
        tags: ['Strategy'],
    },
    {
        id: 'yieldedge-meth',
        name: 'YieldEdge mETH',
        iconUrl: TOKEN_ICONS.WETH,
        asset: 'meth',
        deposits: { amount: '520.5', asset: 'mETH', usd: '$1.82M' },
        liquidity: { amount: '312.3', asset: 'mETH', usd: '$1.09M' },
        curator: { name: 'YieldEdge', isVerified: true },
        exposureAssets: [
            { symbol: 'mETH', icon: TOKEN_ICONS.WETH, amount: '364', percentage: 70, color: '#ec4899' },
            { symbol: 'WETH', icon: TOKEN_ICONS.WETH, amount: '156', percentage: 30, color: '#8b5cf6' }
        ],
        apy: { value: '3.80%', isHigh: true },
        isLive: true,
    },
    {
        id: 'steakhouse-usdc',
        name: 'Steakhouse USDC',
        iconUrl: TOKEN_ICONS.USDC,
        asset: 'usdc',
        deposits: { amount: '373.45M', asset: 'USDC', usd: '$373.35M' },
        liquidity: { amount: '177.70M', asset: 'USDC', usd: '$177.65M' },
        curator: { name: 'Steakhouse', isVerified: true },
        exposureAssets: [
            { symbol: 'WBTC', icon: TOKEN_ICONS.WBTC, amount: '$180M', percentage: 48, color: '#f7931a' },
            { symbol: 'wstETH', icon: TOKEN_ICONS.wstETH, amount: '$100M', percentage: 27, color: '#6366f1' },
            { symbol: 'USDC', icon: TOKEN_ICONS.USDC, amount: '$93M', percentage: 25, color: '#2775ca' }
        ],
        apy: { value: '2.63%', isHigh: false },
        isLive: false,
    },
    {
        id: 'gauntlet-usdc-prime',
        name: 'Gauntlet USDC Prime',
        iconUrl: TOKEN_ICONS.USDC,
        asset: 'usdc',
        deposits: { amount: '115.22M', asset: 'USDC', usd: '$115.19M' },
        liquidity: { amount: '50.15M', asset: 'USDC', usd: '$50.12M' },
        curator: { name: 'Gauntlet', isVerified: true },
        exposureAssets: [
            { symbol: 'USDC', icon: TOKEN_ICONS.USDC, amount: '$60M', percentage: 52, color: '#2775ca' },
            { symbol: 'WBTC', icon: TOKEN_ICONS.WBTC, amount: '$55M', percentage: 48, color: '#f7931a' }
        ],
        apy: { value: '2.66%', isHigh: false },
        isLive: false,
    },
    {
        id: 'smokehouse-usdc',
        name: 'Smokehouse USDC',
        iconUrl: TOKEN_ICONS.USDC,
        asset: 'usdc',
        deposits: { amount: '127.39M', asset: 'USDC', usd: '$127.36M' },
        liquidity: { amount: '18.37M', asset: 'USDC', usd: '$18.37M' },
        curator: { name: 'Steakhouse', isVerified: true },
        exposureAssets: [
            { symbol: 'sUSDe', icon: TOKEN_ICONS.sUSDe, amount: '$100M', percentage: 78, color: '#000000' },
            { symbol: 'wsrUSD', icon: TOKEN_ICONS.wsrUSD, amount: '$27M', percentage: 22, color: '#f59e0b' }
        ],
        apy: { value: '5.96%', isHigh: true },
        isLive: false,
    },
    {
        id: 're7-weth',
        name: 'Re7 WETH',
        iconUrl: TOKEN_ICONS.WETH,
        asset: 'meth',
        deposits: { amount: '45.8K', asset: 'WETH', usd: '$160.5M' },
        liquidity: { amount: '12.3K', asset: 'WETH', usd: '$43.1M' },
        curator: { name: 'Re7 Capital', isVerified: true },
        exposureAssets: [
            { symbol: 'wstETH', icon: TOKEN_ICONS.wstETH, amount: '25K', percentage: 55, color: '#6366f1' },
            { symbol: 'weETH', icon: TOKEN_ICONS.weETH, amount: '20K', percentage: 45, color: '#3b82f6' }
        ],
        apy: { value: '4.15%', isHigh: false },
        isLive: false,
    },
    {
        id: 'gauntlet-weth',
        name: 'Gauntlet WETH',
        iconUrl: TOKEN_ICONS.WETH,
        asset: 'meth',
        deposits: { amount: '28.5K', asset: 'WETH', usd: '$99.8M' },
        liquidity: { amount: '8.2K', asset: 'WETH', usd: '$28.7M' },
        curator: { name: 'Gauntlet', isVerified: true },
        exposureAssets: [
            { symbol: 'WETH', icon: TOKEN_ICONS.WETH, amount: '20K', percentage: 70, color: '#8b5cf6' },
            { symbol: 'weETH', icon: TOKEN_ICONS.weETH, amount: '8.5K', percentage: 30, color: '#3b82f6' }
        ],
        apy: { value: '3.42%', isHigh: false },
        isLive: false,
    },
    {
        id: 'morpho-usdy',
        name: 'Morpho USDY',
        iconUrl: TOKEN_ICONS.USDC,
        asset: 'usdy',
        deposits: { amount: '89.2M', asset: 'USDY', usd: '$89.2M' },
        liquidity: { amount: '34.5M', asset: 'USDY', usd: '$34.5M' },
        curator: { name: 'Morpho Labs', isVerified: true },
        exposureAssets: [
            { symbol: 'USDC', icon: TOKEN_ICONS.USDC, amount: '$45M', percentage: 50, color: '#2775ca' },
            { symbol: 'sUSDS', icon: TOKEN_ICONS.sUSDS, amount: '$44M', percentage: 50, color: '#16a34a' }
        ],
        apy: { value: '4.85%', isHigh: false },
        isLive: false,
    },
];

// Filter options
const DEPOSIT_OPTIONS = ['All', 'USDY', 'mETH', 'USDC', 'WETH'];
const CURATOR_OPTIONS = ['All', 'YieldEdge', 'Steakhouse', 'Gauntlet', 'Re7 Capital', 'Morpho Labs'];

export function VaultsTable() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const { currentAsset, assetConfig } = useAsset();
    const { data: depositInfo, isLoading: isLoadingDeposit } = useDepositInfo();
    const { data: tokenBalance } = useTokenBalance();
    const contracts = useCurrentAssetContracts();

    const [activeTab, setActiveTab] = useState<'positions' | 'vaults'>('vaults');
    const [inWalletFilter, setInWalletFilter] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Dropdown states
    const [depositFilter, setDepositFilter] = useState('All');
    const [curatorFilter, setCuratorFilter] = useState('All');
    const [showDepositDropdown, setShowDepositDropdown] = useState(false);
    const [showCuratorDropdown, setShowCuratorDropdown] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRowClick = (vaultId: string) => {
        router.push(`/vault/${vaultId}`);
    };

    // Format user's position data
    const userDeposit = depositInfo?.currentValue ? parseFloat(depositInfo.currentValue) : 0;
    const userPrincipal = depositInfo?.principal ? parseFloat(depositInfo.principal) : 0;
    const userYield = depositInfo?.totalYield ? parseFloat(depositInfo.totalYield) : 0;
    const walletBalance = tokenBalance ? parseFloat(formatEther(tokenBalance)) : 0;
    const currencySymbol = currentAsset === 'usdy' ? '$' : 'Ξ';

    // Filter vaults based on "In Wallet" toggle
    const filteredVaults = inWalletFilter && isConnected
        ? VAULTS_DATA.filter(v => v.asset === currentAsset)
        : VAULTS_DATA;

    return (
        <div className="w-full space-y-8 font-sans text-[var(--foreground)]">

            {/* Top Controls: Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.4)] p-1.5 rounded-full backdrop-blur-sm self-start">
                    <button
                        onClick={() => setActiveTab('positions')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300",
                            activeTab === 'positions'
                                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(148,116,147,0.2)]"
                                : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.4)]"
                        )}
                    >
                        Your positions
                    </button>
                    <button
                        onClick={() => setActiveTab('vaults')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300",
                            activeTab === 'vaults'
                                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(148,116,147,0.2)]"
                                : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.4)]"
                        )}
                    >
                        Vaults
                    </button>
                </div>
            </div>

            {/* Filter Bar (only show for Vaults tab) */}
            {activeTab === 'vaults' && (
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4 bg-[var(--card)] backdrop-blur-sm rounded-[24px] border border-[var(--border)] shadow-sm">
                    <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                        {/* In Wallet Toggle */}
                        <div className={cn(
                            "flex items-center gap-3 transition-opacity",
                            !isConnected && "opacity-50"
                        )}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">In Wallet</span>
                            <button
                                onClick={() => isConnected && setInWalletFilter(!inWalletFilter)}
                                disabled={!isConnected}
                                className={cn(
                                    "relative w-12 h-6 rounded-full transition-colors border border-[rgba(0,0,0,0.05)]",
                                    inWalletFilter && isConnected ? "bg-[var(--primary)]" : "bg-[rgba(200,200,200,0.3)]",
                                    !isConnected && "cursor-not-allowed"
                                )}
                                title={!isConnected ? "Connect wallet to filter" : ""}
                            >
                                <div className={cn(
                                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                    inWalletFilter && isConnected ? "left-[28px]" : "left-1"
                                )}></div>
                            </button>
                        </div>

                        {/* Deposit Dropdown */}
                        <div className="relative flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Deposit</span>
                            <button
                                onClick={() => { setShowDepositDropdown(!showDepositDropdown); setShowCuratorDropdown(false); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.5)] border border-[var(--borderSoft)] hover:bg-[rgba(255,255,255,0.8)] transition-all text-[var(--foreground)] font-serif text-sm group min-w-[100px] justify-between"
                            >
                                {depositFilter}
                                <ChevronDown className={cn("w-3 h-3 text-[var(--secondary)] transition-transform duration-300", showDepositDropdown && "rotate-180")} />
                            </button>
                            {showDepositDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[rgba(255,255,255,0.95)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                                    {DEPOSIT_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setDepositFilter(opt); setShowDepositDropdown(false); }}
                                            className={cn(
                                                "w-full text-left px-5 py-3 text-sm hover:bg-[rgba(148,116,147,0.08)] transition-colors font-serif",
                                                depositFilter === opt ? "text-[var(--primary)] font-bold bg-[rgba(148,116,147,0.03)]" : "text-[var(--secondary)]"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Curator Dropdown */}
                        <div className="relative flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Curator</span>
                            <button
                                onClick={() => { setShowCuratorDropdown(!showCuratorDropdown); setShowDepositDropdown(false); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.5)] border border-[var(--borderSoft)] hover:bg-[rgba(255,255,255,0.8)] transition-all text-[var(--foreground)] font-serif text-sm group min-w-[140px] justify-between"
                            >
                                {curatorFilter}
                                <ChevronDown className={cn("w-3 h-3 text-[var(--secondary)] transition-transform duration-300", showCuratorDropdown && "rotate-180")} />
                            </button>
                            {showCuratorDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[rgba(255,255,255,0.95)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                                    {CURATOR_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setCuratorFilter(opt); setShowCuratorDropdown(false); }}
                                            className={cn(
                                                "w-full text-left px-5 py-3 text-sm hover:bg-[rgba(148,116,147,0.08)] transition-colors font-serif",
                                                curatorFilter === opt ? "text-[var(--primary)] font-bold bg-[rgba(148,116,147,0.03)]" : "text-[var(--secondary)]"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative group w-full xl:w-72">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Filter vaults..."
                                className="block w-full bg-[rgba(255,255,255,0.5)] border border-[var(--borderSoft)] text-[var(--foreground)] text-sm rounded-full pl-10 pr-6 py-2.5 focus:outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted)]/50 font-serif"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========== YOUR POSITIONS TAB ========== */}
            {activeTab === 'positions' && (
                <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] shadow-xl overflow-hidden p-2">
                    {!mounted ? (
                        <div className="p-20 text-center text-[var(--muted)] font-serif italic text-lg opacity-60">Loading...</div>
                    ) : !isConnected ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-[rgba(148,116,147,0.1)] rounded-full flex items-center justify-center border border-[rgba(148,116,147,0.1)]">
                                <Wallet className="w-8 h-8 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-2xl font-serif text-[var(--foreground)] mb-3">Connect your wallet</h3>
                            <p className="text-[var(--secondary)] text-sm max-w-sm mx-auto leading-relaxed">
                                Connect your wallet to view your positions and deposited assets.
                            </p>
                        </div>
                    ) : userDeposit <= 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-[rgba(148,116,147,0.1)] rounded-full flex items-center justify-center border border-[rgba(148,116,147,0.1)]">
                                <TrendingUp className="w-8 h-8 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-2xl font-serif text-[var(--foreground)] mb-3">No positions yet</h3>
                            <p className="text-[var(--secondary)] text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                                Deposit {assetConfig.symbol} into a vault to start earning yield and make predictions.
                            </p>
                            <button
                                onClick={() => setActiveTab('vaults')}
                                className="px-8 py-3 bg-[var(--primary)] text-white rounded-full font-bold uppercase tracking-wider text-xs hover:opacity-90 shadow-lg shadow-[rgba(148,116,147,0.3)] transition-all transform hover:scale-105"
                            >
                                Browse Vaults
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {/* User's Position Card */}
                            <div
                                onClick={() => handleRowClick('yieldedge-' + currentAsset)}
                                className="p-8 hover:bg-[rgba(255,255,255,0.4)] cursor-pointer transition-all rounded-[24px]"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-full border border-[var(--borderSoft)] overflow-hidden shadow-sm flex-shrink-0 bg-white p-1">
                                            {assetConfig.icon ? (
                                                <img src={assetConfig.icon} alt={assetConfig.symbol} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[var(--primary)] text-white font-serif font-bold rounded-full">
                                                    {assetConfig.symbol[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-2xl font-serif text-[var(--foreground)]">
                                                YieldEdge {assetConfig.symbol}
                                            </div>
                                            <div className="text-sm text-[var(--secondary)] font-medium">
                                                {assetConfig.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-4xl font-serif text-[var(--foreground)]">
                                            {currencySymbol}{userDeposit.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-[var(--primary)] font-bold uppercase tracking-wider mt-1">
                                            +{currencySymbol}{userYield.toFixed(4)} yield
                                        </div>
                                    </div>
                                </div>

                                {/* Details Row */}
                                <div className="pt-6 border-t border-[rgba(0,0,0,0.03)] grid grid-cols-3 gap-8 text-sm">
                                    <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)]">
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Principal</div>
                                        <div className="font-serif text-xl text-[var(--foreground)]">{currencySymbol}{userPrincipal.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)]">
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Accrued Yield</div>
                                        <div className="font-serif text-xl text-[var(--primary)]">+{currencySymbol}{userYield.toFixed(4)}</div>
                                    </div>
                                    <div className="bg-[rgba(255,255,255,0.4)] rounded-2xl p-4 border border-[var(--borderSoft)]">
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">APY</div>
                                        <div className="font-serif text-xl text-[#4A6D4D]">{assetConfig.apy}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Balance Info */}
                            <div className="p-6 bg-[rgba(148,116,147,0.03)] rounded-[24px] flex items-center justify-between text-sm mx-2 mb-2">
                                <div className="flex items-center gap-3 text-[var(--secondary)]">
                                    <Wallet className="w-5 h-5 text-[var(--primary)]" />
                                    <span className="font-medium">Wallet Balance</span>
                                </div>
                                <div className="font-serif text-xl text-[var(--foreground)]">
                                    {walletBalance.toFixed(2)} <span className="text-sm text-[var(--muted)]">{assetConfig.symbol}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========== VAULTS TAB ========== */}
            {activeTab === 'vaults' && (
                <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--borderSoft)]">
                                    <th className="px-8 py-6 text-left">
                                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Vault</span>
                                    </th>
                                    <th className="px-8 py-6 text-left">
                                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Deposits</span>
                                    </th>
                                    <th className="px-8 py-6 text-left">
                                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Liquidity</span>
                                    </th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                                        Curator
                                    </th>
                                    <th className="px-8 py-6 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                                        Exposure
                                    </th>
                                    <th className="px-8 py-6 text-right">
                                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">APY</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--borderSoft)]">
                                {filteredVaults.map((vault) => (
                                    <tr
                                        key={vault.id}
                                        onClick={() => handleRowClick(vault.id)}
                                        className="group hover:bg-[rgba(148,116,147,0.03)] transition-all duration-300 cursor-pointer"
                                    >
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full border border-[var(--borderSoft)] overflow-hidden shadow-sm flex-shrink-0 bg-white p-0.5">
                                                    <img src={vault.iconUrl} alt={vault.name} className="w-full h-full object-cover rounded-full" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-serif font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                            {vault.name}
                                                        </span>
                                                        {vault.isLive && (
                                                            <Badge variant="outline" className="bg-[#eef5ef] text-[#4A6D4D] border-[#a3bba4] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                                Live
                                                            </Badge>
                                                        )}
                                                        {(vault as any).tags && (vault as any).tags.includes('Strategy') && (
                                                            <Badge variant="outline" className="bg-[rgba(148,116,147,0.1)] text-[var(--primary)] border-[var(--primary)]/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                                Strategy
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-lg font-serif font-medium text-[var(--foreground)]">{vault.deposits.amount} <span className="text-xs text-[var(--muted)]">{vault.deposits.asset}</span></div>
                                                <div className="text-xs text-[var(--secondary)] font-medium mt-1">{vault.deposits.usd}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-lg font-serif font-medium text-[var(--foreground)]">{vault.liquidity.amount} <span className="text-xs text-[var(--muted)]">{vault.liquidity.asset}</span></div>
                                                <div className="text-xs text-[var(--secondary)] font-medium mt-1">{vault.liquidity.usd}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {vault.curator.name === 'YieldEdge' ? (
                                                    <div className="h-8 w-8 rounded-full bg-[rgba(148,116,147,0.1)] border border-[rgba(148,116,147,0.2)] flex items-center justify-center text-[var(--primary)] shadow-sm">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                ) : vault.curator.name === 'Steakhouse' ? (
                                                    <div className="h-8 w-8 rounded-full bg-[#fff8e1] border border-[#fcd34d] flex items-center justify-center text-orange-600 shadow-sm">
                                                        <Flame className="w-4 h-4" />
                                                    </div>
                                                ) : vault.curator.name === 'Gauntlet' ? (
                                                    <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                                        <Gem className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                                        {vault.curator.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-[var(--foreground)]">{vault.curator.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <ExposureDisplay assets={vault.exposureAssets} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <span className={cn(
                                                "text-xl font-serif font-bold",
                                                vault.apy.isHigh ? "text-[#4A6D4D]" : "text-[var(--foreground)]"
                                            )}>
                                                {vault.apy.value}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-[var(--borderSoft)] bg-[rgba(255,255,255,0.2)] flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
                            Showing {filteredVaults.length} vaults
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
