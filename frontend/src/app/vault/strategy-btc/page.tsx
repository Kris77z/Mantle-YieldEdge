'use client';

import React, { useState } from 'react';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { ChevronRight, ShieldCheck, Copy, ExternalLink, Info, Sparkles, Wallet, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TOKEN_ICONS, getContracts, MOCK_USDY_ABI, STRATEGY_VAULT_ABI } from '@/config/contracts';
import { ExposureDisplay, ExposureAsset } from '@/components/vault/ExposureDisplay';
import { useAsset } from '@/context/AssetContext';
import { useTokenBalance, useStrategyLockInfo } from '@/hooks/useYieldEdge';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';

// Mock Chart Data
const DATA = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    apy: 15 + Math.random() * 5, // Higher APY for Strategy
    tvl: 50 + i * 2 + Math.random() * 5
}));

type Tab = 'your-position' | 'overview' | 'performance' | 'risk' | 'activity';

export default function VaultDetailsPage() {
    const params = { id: 'strategy-btc' }; // Hardcoded
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [activeSection, setActiveSection] = useState<Tab>('overview');

    // UI State
    const [isFlashMode, setIsFlashMode] = useState(true);
    const [lockDuration, setLockDuration] = useState(30);
    const [lastAction, setLastAction] = useState<'approve' | 'deposit' | 'withdraw' | null>(null);

    const { setAsset } = useAsset();
    const { isConnected, address, chainId } = useAccount();

    // Contracts
    const contracts = getContracts(chainId || 5003);
    const strategyConfig = contracts.strategies?.btcBull;
    const strategyAddress = strategyConfig?.address;
    const usdyAddress = contracts.tokens.usdy.address;
    const { data: lockInfo } = useStrategyLockInfo(strategyAddress as string);


    // Hardcode USDY asset context
    React.useEffect(() => {
        setAsset('usdy');
    }, [setAsset]);

    const { data: balance, refetch: refetchBalance } = useTokenBalance();


    // Strategy Reads
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: usdyAddress,
        abi: MOCK_USDY_ABI,
        functionName: 'allowance',
        args: [address!, strategyAddress!],
        query: { enabled: !!address && !!strategyAddress }
    });

    const { data: positionData, refetch: refetchPosition } = useReadContract({
        address: strategyAddress,
        abi: STRATEGY_VAULT_ABI,
        functionName: 'positions',
        args: [address!],
        query: { enabled: !!address && !!strategyAddress }
    });

    const { data: strategyAsset } = useReadContract({
        address: strategyAddress,
        abi: [{ name: 'asset', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
        functionName: 'asset',
        query: { enabled: !!strategyAddress }
    });

    // Debug Log
    React.useEffect(() => {
        if (strategyAsset && usdyAddress && strategyAsset.toLowerCase() !== usdyAddress.toLowerCase()) {
            console.error('CRITICAL Config Mismatch: Strategy expects asset', strategyAsset, 'but configured USDY is', usdyAddress);
            toast.error('Configuration Error: Strategy asset mismatch');
        }
    }, [strategyAsset, usdyAddress]);

    // Writes
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // Define needsApproval early for simulation check
    const needsApproval = allowance ? (allowance as bigint) < parseEther(amount || '0') : true;

    // Simulation for Deposit to catch Reverts early
    const shouldSimulateDeposit = !!amount && !!strategyAddress && parseFloat(amount) > 0 && !needsApproval;
    const { data: depositSimData, error: depositSimError } = useSimulateContract({
        address: strategyAddress,
        abi: STRATEGY_VAULT_ABI,
        functionName: 'deposit',
        args: [amount ? parseEther(amount) : 0n],
        query: {
            enabled: shouldSimulateDeposit,
            retry: false
        }
    });

    // Log simulation error if present
    React.useEffect(() => {
        if (depositSimError) {
            console.error("Deposit Simulation Error:", depositSimError);
        }
    }, [depositSimError]);

    // Derived State
    const isPending = isWritePending || isConfirming;
    const isApproving = isPending; // Simplified for UI
    const isDepositing = isPending;
    const isWithdrawing = isPending;

    // Manual Asset Config for Strategy
    const assetConfig = {
        symbol: 'USDY',
        name: 'BTC Bull Strategy',
        icon: TOKEN_ICONS.WBTC,
        decimals: 18,
        vault: strategyAddress
    };
    const currentAsset = 'usdy';
    const symbol = 'USDY';

    // Map Position Data to Generic Format
    const userPrincipal = positionData ? formatEther(positionData[0]) : '0';
    const userShares = positionData ? formatEther(positionData[1]) : '0';

    const depositInfo = {
        currentValue: userPrincipal, // For Strategy, Value = Principal (Zero Loss) + Upside? Just show Principal for now.
        principal: userPrincipal,
        totalYield: '0.00', // Strategy yield is complex, handled by upside
        unlockedYield: '0.00',
        lockedYield: '0.00'
    };

    const exposureAssets: ExposureAsset[] = [
        { symbol: 'USDY', icon: TOKEN_ICONS.USDC, amount: 'Principal', percentage: 95, color: '#2775ca' },
        { symbol: 'BTC Call', icon: TOKEN_ICONS.WBTC, amount: 'Yield', percentage: 5, color: '#f7931a' }
    ];

    const availableYield = '0.00'; // N/A for Strategy input


    // Actions
    const handleAction = () => {
        if (!amount || !strategyAddress) return;
        const val = parseEther(amount);

        if (activeTab === 'withdraw') {
            setLastAction('withdraw');
            writeContract({
                address: strategyAddress,
                abi: STRATEGY_VAULT_ABI,
                functionName: 'withdraw',
                args: []
            });
            return;
        }

        // Deposit Flow
        const currentAllowance = allowance ? (allowance as bigint) : 0n;
        const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

        if (currentAllowance < val) {
            setLastAction('approve');
            writeContract({
                address: usdyAddress!,
                abi: MOCK_USDY_ABI,
                functionName: 'approve',
                args: [strategyAddress, maxUint256], // Max Approval
            });
        } else {
            setLastAction('deposit');

            // Check for simulation error
            if (depositSimError) {
                console.error("Simulation failed:", depositSimError);
                toast.error(`Transaction Reverted: ${(depositSimError as any).shortMessage || depositSimError.message || 'Gas too low / Logic Error'}`);
                return;
            }

            try {
                if (depositSimData?.request) {
                    writeContract(depositSimData.request);
                } else {
                    // Fallback if simulation didn't run yet but checks pass (shouldn't happen often)
                    writeContract({
                        address: strategyAddress,
                        abi: STRATEGY_VAULT_ABI,
                        functionName: 'deposit',
                        args: [val],
                        gas: 10000000n // Huge gas limit fallback
                    });
                }
            } catch (err) {
                console.error("Deposit Error:", err);
                toast.error("Deposit failed to simulate. " + (err as any)?.shortMessage);
            }
        }

    };

    React.useEffect(() => {
        if (isConfirmed) {
            toast.success('Transaction Confirmed');
            refetchBalance();
            refetchAllowance();
            refetchPosition();
            if (lastAction !== 'approve') {
                setAmount('');
            }
        }
    }, [isConfirmed, refetchBalance, refetchAllowance, refetchPosition, lastAction]);

    const displayBalance = balance ? parseFloat(formatEther(balance)).toFixed(2) : '0.00';
    const displayPosition = userPrincipal;



    // Mock vars for UI compatibility
    const isRealVault = true;
    // needsApproval is defined earlier for simulation check

    // Loading states for UI (mocked)
    const isApprovingConfirm = isConfirming;
    const isDepositingConfirm = isConfirming;
    const isWithdrawingConfirm = isConfirming;
    const isFlashDepositing = false;
    const isFlashConfirming = false;

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
                    <span className="text-[var(--foreground)] font-bold">Steakhouse USDC</span>
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
                                    <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-3xl font-serif font-bold shadow-lg border border-[var(--borderSoft)]">
                                        {assetConfig.symbol[0]}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-[var(--foreground)] tracking-tight">{assetConfig.name}</h1>
                                        <Badge variant="secondary" className="bg-[var(--surface-1)] text-[var(--primary)] border border-[var(--borderSoft)] font-medium tracking-wide">V2</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--muted)] mt-2 text-sm uppercase tracking-wide">
                                        <span>Curated by</span>
                                        <span className="flex items-center gap-2 font-bold text-[var(--foreground)]">
                                            <div className="w-6 h-6 rounded-full bg-[#f8fafc] border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">S</div>
                                            Steakhouse Financial <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Yield Stats Card */}
                            <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 mb-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3">
                                    <Sparkles className="w-32 h-32 text-[var(--primary)]" />
                                </div>
                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2 font-semibold">Available y{symbol}</div>
                                        <div className="text-4xl md:text-5xl font-serif font-medium flex items-center gap-3 text-[var(--primary)]">
                                            <Sparkles className="w-6 h-6" />
                                            {availableYield ? parseFloat(availableYield).toFixed(4) : '0.0000'}
                                        </div>
                                        <div className="text-xs text-[var(--muted)] mt-2 font-medium tracking-wide">Betting Power</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2 font-semibold">Boosted APY</div>
                                        <div className="text-4xl md:text-5xl font-serif font-medium text-[#4A6D4D]">50.00%</div>
                                        <div className="text-xs text-[var(--muted)] mt-2 font-medium tracking-wide">Instant Yield Active</div>
                                    </div>
                                </div>
                            </div>

                            {/* Big Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-2">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2 font-bold">Total Deposits</div>
                                    <div className="text-3xl font-serif text-[var(--foreground)]">$381.75<span className="text-lg text-[var(--muted)] ml-1">M</span></div>
                                    <div className="text-xs text-[var(--muted)] mt-1 font-mono opacity-60">381.78M USDC</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2 font-bold">Liquidity</div>
                                    <div className="text-3xl font-serif text-[var(--foreground)]">$62.90<span className="text-lg text-[var(--muted)] ml-1">M</span></div>
                                    <div className="text-xs text-[var(--muted)] mt-1 font-mono opacity-60">62.91M USDC</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2 font-bold">Exposure</div>
                                    <div className="mt-1">
                                        <ExposureDisplay assets={exposureAssets} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2 font-bold flex items-center gap-1">
                                        APY <Info className="w-3 h-3 text-[var(--muted)]" />
                                    </div>
                                    <div className="text-3xl font-serif text-[var(--foreground)] flex items-center gap-2">
                                        4.82<span className="text-lg">%</span>
                                        {/* Sparkles Icon */}
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--primary)] opacity-50">
                                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" fillOpacity="0.5" />
                                            <path d="M18 18L19 21L22 22L19 23L18 26L17 23L14 22L17 21L18 18Z" fill="currentColor" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="border-b border-[var(--borderSoft)]">
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
                                            "py-4 text-sm font-medium border-b-2 transition-all",
                                            activeSection === tab.id
                                                ? "border-[var(--foreground)] text-[var(--foreground)]"
                                                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--borderSoft)]"
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
                                                <div className="text-sm text-[var(--muted)] font-medium mb-1">My Deposit</div>
                                                <div className="text-5xl font-medium text-[var(--foreground)] tracking-tight">
                                                    {depositInfo?.currentValue ? parseFloat(depositInfo.currentValue).toFixed(2) : '0.00'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="text-[var(--secondary)] bg-[var(--surface-1)]">{symbol}</Badge>
                                            </div>
                                        </div>

                                        {/* Position Details */}
                                        {depositInfo && parseFloat(depositInfo.principal) > 0 && (
                                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-[var(--surface-1)] rounded-xl p-4">
                                                    <div className="text-xs text-[var(--muted)] mb-1">Principal</div>
                                                    <div className="text-lg font-semibold text-[var(--foreground)]">
                                                        {parseFloat(depositInfo.principal).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[#4A6D4D]/10 rounded-xl p-4">
                                                    <div className="text-xs text-[#4A6D4D] mb-1">Unlocked Yield</div>
                                                    <div className="text-lg font-semibold text-[#4A6D4D]">
                                                        {parseFloat(depositInfo.unlockedYield) >= 0 ? '+' : ''}{parseFloat(depositInfo.unlockedYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[var(--gold)]/10 rounded-xl p-4">
                                                    <div className="text-xs text-[var(--gold)] mb-1">Locked Yield</div>
                                                    <div className="text-lg font-semibold text-[var(--gold)]">
                                                        {parseFloat(depositInfo.lockedYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                                <div className="bg-[var(--primary)]/10 rounded-xl p-4">
                                                    <div className="text-xs text-[var(--primary)] mb-1">Total Yield</div>
                                                    <div className="text-lg font-semibold text-[var(--primary)]">
                                                        {parseFloat(depositInfo.totalYield) >= 0 ? '+' : ''}{parseFloat(depositInfo.totalYield).toFixed(2)} {symbol}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Strategy Auto-Bet Info */}
                                        {depositInfo && parseFloat(depositInfo.principal) > 0 && (
                                            <div className="mt-6 bg-gradient-to-r from-[var(--gold)]/10 to-[var(--surface-2)] border border-[var(--gold)]/20 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0">
                                                        <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-[var(--foreground)] mb-1">🎯 Strategy Auto-Executed</h4>
                                                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                                                            Your flash yield has been automatically bet on <span className="font-semibold text-[var(--foreground)]">"BTC &gt; $100k by Jan 2026"</span> market, outcome: <span className="inline-flex items-center gap-1 bg-[#4A6D4D]/20 text-[#4A6D4D] px-2 py-0.5 rounded font-semibold text-xs">YES</span>.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-4 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[var(--gold)]">Bet Amount:</span>
                                                                <span className="font-semibold text-[var(--foreground)]">~{(parseFloat(depositInfo.principal) * 0.5 * 30 / 365).toFixed(2)} yUSDY</span>
                                                            </div>
                                                            <Link
                                                                href="/markets/0xa188527c4a95f0a413d3cb91c48c3d7be8745aaa"
                                                                className="text-[var(--primary)] hover:underline font-medium flex items-center gap-1"
                                                            >
                                                                View Market <ChevronRight className="w-3 h-3" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {(!depositInfo || parseFloat(depositInfo.principal) === 0) && (
                                            <div className="mt-8 text-center py-8 text-slate-400">
                                                <p className="mb-4">No deposits yet. Your flash yield will be auto-bet on featured markets!</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-medium text-[var(--foreground)]">Your transactions</h3>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 text-center text-[var(--muted)] min-h-[200px] flex items-center justify-center">
                                            <div>
                                                <p>Transaction history coming soon.</p>
                                                <p className="text-sm mt-2">View on <a href={`https://sepolia.mantlescan.xyz/address/${assetConfig.vault}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline">Mantle Explorer</a></p>
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
                                                <div className="text-4xl font-serif font-medium text-[var(--foreground)] tracking-tight">18.82%</div>
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
                                                    <span className="font-medium text-[var(--foreground)]">Base APY</span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">4.54%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[rgba(148,116,147,0.1)] flex items-center justify-center text-[var(--primary)]">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-[var(--foreground)]">Strategy Alpha</span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">+14.28%</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-[var(--muted)]">
                                                        $
                                                    </div>
                                                    <span className="font-medium text-[var(--foreground)]">Performance Fee <span className="bg-[var(--surface-1)] text-[10px] px-1.5 py-0.5 rounded ml-1">10%</span></span>
                                                </div>
                                                <span className="font-serif font-bold text-[var(--foreground)]">-1.42%</span>
                                            </div>
                                            <div className="pt-6 border-t border-[var(--borderSoft)] flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-[var(--primary)] font-medium">
                                                    <span className="text-[var(--primary)]">✨</span> Net APY
                                                </div>
                                                <span className="font-serif font-bold text-[var(--primary)] text-xl">= 18.82%</span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Market Exposure Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-medium text-[var(--foreground)]">Market Exposure</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[var(--muted)]">Breakdown</span>
                                                <ExposureDisplay assets={exposureAssets} />
                                            </div>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[var(--surface-1)] border-b border-[var(--borderSoft)] text-[var(--muted)] font-medium">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left">Asset</th>
                                                        <th className="px-6 py-4 text-left">Protocol</th>
                                                        <th className="px-6 py-4 text-right">Allocation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--borderSoft)]">
                                                    {exposureAssets.map((asset, i) => (
                                                        <tr key={i} className="hover:bg-[var(--surface-1)] transition-colors">
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <img src={asset.icon} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                                                                <span className="font-medium text-[var(--foreground)]">{asset.symbol}</span>
                                                                {asset.isIdle ? <span className="text-[10px] bg-[var(--surface-2)] text-[var(--muted)] px-1.5 py-0.5 rounded font-medium">Idle</span> : null}
                                                            </td>
                                                            <td className="px-6 py-4 text-[var(--secondary)]">Morpho {currentAsset as string === 'meth' ? 'Blue' : 'Rewards'}</td>
                                                            <td className="px-6 py-4 text-right font-medium text-[var(--foreground)]">{asset.percentage}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Performance Tab (Previously Implemented) */}
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
                                                        contentStyle={{ borderRadius: '12px', background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        cursor={{ stroke: 'var(--muted)' }}
                                                    />
                                                    <Area type="monotone" dataKey="apy" stroke="#947493" strokeWidth={3} fillOpacity={1} fill="url(#colorApy)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Returns Grid */}
                                    <div>
                                        <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Returns</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                                                    Instant APY <Info className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                                                    4.84% <span className="text-[var(--primary)]">✨</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--muted)]">7D APY</span>
                                                <span className="font-medium text-[var(--foreground)]">4.16%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--muted)]">30D APY</span>
                                                <span className="font-medium text-[var(--foreground)]">3.89%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--muted)]">90D APY</span>
                                                <span className="font-medium text-[var(--foreground)]">4.23%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--muted)]">Performance Fee</span>
                                                <span className="font-medium text-[var(--foreground)]">0.00%</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                <span className="text-[var(--muted)]">Fee Recipient</span>
                                                <div className="flex items-center gap-2 text-[var(--foreground)]">
                                                    <span className="font-mono text-sm">0x255c...085a</span>
                                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]" />
                                                    <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]" />
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
                                        <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">Risk Disclosures</h3>
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
                                                <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--borderSoft)]">
                                                    <span className="text-[var(--muted)]">{item.label}</span>
                                                    <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
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
                                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                                            Market Risk Disclosures <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
                                        </h4>
                                        <div className="bg-[var(--surface-1)] rounded-xl p-4 text-xs text-[var(--muted)] leading-relaxed border border-[var(--borderSoft)]">
                                            Steakhouse (incl. Prime) Vaults are designed to minimize volatility by programmatically allocating against highly-liquid assets. While Steakhouse Vaults are focused on established markets, no strategy eliminates risk entirely.
                                        </div>
                                    </div>

                                    {/* Ratings & Risk Curation */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div>
                                            <h3 className="text-lg font-medium text-[var(--foreground)] mb-6 flex items-center gap-2">Ratings <Info className="w-4 h-4 text-[var(--muted)]" /></h3>
                                            <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-6 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Risk Score</div>
                                                    <div className="text-3xl font-bold text-[var(--foreground)]">A</div>
                                                </div>
                                                <div className="h-10 w-10 bg-[var(--surface-1)] rounded-lg flex items-center justify-center">
                                                    <ExternalLink className="w-5 h-5 text-[var(--muted)]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">Risk Curation</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Allocator Address', type: 'Public Allocator', addr: '0xfd32...c75D' },
                                                    { label: 'Allocator Address', type: '', addr: '0x9E91...f9e1' },
                                                    { label: 'Allocator Address', type: '', addr: '0xfeed...3C9a' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--borderSoft)]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[var(--muted)]">{item.label}</span>
                                                            {item.type && <Badge variant="secondary" className="text-[10px] h-5 bg-[var(--surface-1)] text-[var(--muted)]">{item.type}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[var(--foreground)] font-mono text-sm">
                                                            {item.addr} <Copy className="w-3 h-3 text-[var(--muted)]" />
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
                                        <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">User Distribution</h3>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[var(--surface-1)] border-b border-[var(--borderSoft)] text-[var(--muted)] font-medium">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left">User</th>
                                                        <th className="px-6 py-4 text-left">Deposit</th>
                                                        <th className="px-6 py-4 text-right">% of Deposits</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--borderSoft)]">
                                                    {[
                                                        { user: '0x9390...A1D1', deposit: '193,264,429.49 USDC', val: '$193.24M', pct: '50.62%' },
                                                        { user: '0x334F...2A7b', deposit: '32,474,724.04 USDC', val: '$32.47M', pct: '8.50%' },
                                                        { user: '0x1870...a12e', deposit: '30,230,513.23 USDC', val: '$30.22M', pct: '7.91%' },
                                                        { user: '0xD1A1...c1BC', deposit: '9,744,946.2 USDC', val: '$9.74M', pct: '2.55%' },
                                                    ].map((row, i) => (
                                                        <tr key={i} className="hover:bg-[var(--surface-1)] transition-colors">
                                                            <td className="px-6 py-4 font-mono text-[var(--secondary)] flex items-center gap-2">
                                                                <div className={`w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500`}></div>
                                                                {row.user}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-medium text-[var(--foreground)]">{row.deposit}</span>
                                                                <Badge variant="secondary" className="ml-2 bg-[var(--surface-1)] text-[var(--muted)] font-normal">{row.val}</Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2 text-[var(--secondary)]">
                                                                <div className="w-4 h-4 rounded-full border-2 border-[var(--borderSoft)] border-t-[var(--primary)]"></div>
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
                                            <h3 className="text-lg font-medium text-[var(--foreground)]">All transactions</h3>
                                            <div className="flex gap-2">
                                                <button className="flex items-center gap-1 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
                                                    <ChevronRight className="w-4 h-4 rotate-90" /> All
                                                </button>
                                                <Badge variant="secondary" className="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] cursor-pointer text-[var(--muted)]">Customize</Badge>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[var(--surface-1)] border-b border-[var(--borderSoft)] text-[var(--muted)] font-medium">
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
                                                        <tr key={i} className="hover:bg-[var(--surface-1)] transition-colors">
                                                            <td className="px-6 py-4 text-[var(--muted)] whitespace-nowrap">{row.date}</td>
                                                            <td className="px-6 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">{row.type}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded-full bg-[#4A6D4D] flex-shrink-0"></div>
                                                                    <span className="font-medium text-[var(--foreground)] whitespace-nowrap">{row.amount}</span>
                                                                    <Badge variant="secondary" className="bg-[var(--surface-1)] text-[var(--muted)] text-[10px] whitespace-nowrap">{row.val}</Badge>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-mono text-[var(--secondary)] whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded-full bg-[var(--borderSoft)] flex-shrink-0"></div>
                                                                    <span>{row.user}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono text-[var(--primary)] whitespace-nowrap">0x8e7...</td>
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
                                <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Info className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium">Content for {activeSection} is coming soon.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Interaction Sidebar */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-28 h-fit">

                        {/* Deposit / Withdraw Card */}
                        {/* Deposit / Withdraw Card */}
                        <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] border border-[var(--border)] p-8 shadow-xl">
                            {isRealVault ? (
                                <>
                                    {/* Tabs */}
                                    <div className="flex bg-[var(--surface-1)] p-1.5 rounded-2xl mb-8 border border-[var(--borderSoft)]">
                                        <button
                                            onClick={() => setActiveTab('deposit')}
                                            className={cn(
                                                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                                                activeTab === 'deposit' ? "bg-[var(--background)] text-[var(--primary)] shadow-sm border border-[var(--borderSoft)]" : "text-[var(--muted)] hover:text-[var(--secondary)]"
                                            )}
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('withdraw')}
                                            className={cn(
                                                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                                                activeTab === 'withdraw' ? "bg-[var(--background)] text-[var(--primary)] shadow-sm border border-[var(--borderSoft)]" : "text-[var(--muted)] hover:text-[var(--secondary)]"
                                            )}
                                        >
                                            Withdraw
                                        </button>
                                    </div>

                                    {/* Input Area */}
                                    <div className="space-y-6 mb-8">
                                        <div className="bg-[var(--surface-1)] rounded-[24px] p-6 border border-[var(--borderSoft)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all shadow-inner">
                                            <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3 font-bold">
                                                <span>{activeTab === 'deposit' ? 'Amount' : 'Position'}</span>
                                                <div className="flex flex-col items-end">
                                                    <span>
                                                        {activeTab === 'deposit'
                                                            ? `Balance: ${displayBalance} ${symbol}`
                                                            : `Holdings: ${displayPosition} p${symbol}`
                                                        }
                                                    </span>
                                                    {activeTab === 'withdraw' && lockInfo?.isLocked && (
                                                        <span className="text-[var(--gold)] text-[9px] flex items-center gap-1 mt-0.5">
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                            Locked until {lockInfo.unlockTime.toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="text"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="bg-transparent text-4xl font-serif font-medium text-[var(--foreground)] flex-1 min-w-0 focus:outline-none placeholder:text-[var(--muted)]/30"
                                                />
                                                <div className="flex items-center gap-2 bg-[var(--background)] px-4 py-2 rounded-full border border-[var(--borderSoft)] shadow-sm flex-shrink-0">
                                                    {assetConfig.icon ? <img src={assetConfig.icon} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-[var(--primary)]" />}
                                                    <span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                                                        {activeTab === 'deposit' ? symbol : `p${symbol}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ⚡️ Flash Yield Option */}
                                    {activeTab === 'deposit' && (
                                        <div className="mb-8 relative z-10 transition-all duration-500 ease-in-out">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wide">
                                                        <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Flash Yield
                                                    </span>
                                                    <Badge className="bg-[#B88746] text-white border-none text-[10px] px-2 py-0.5 shadow-sm font-bold tracking-wider">NEW</Badge>
                                                </div>
                                                <div onClick={() => setIsFlashMode(!isFlashMode)} className={cn(
                                                    "w-12 h-7 rounded-full relative cursor-pointer transition-colors duration-300 ease-in-out border border-transparent hover:border-[var(--primary)]/30",
                                                    isFlashMode ? "bg-[var(--primary)]" : "bg-[var(--surface-2)]"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md",
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
                                    <div className="space-y-3 mb-8 px-2">
                                        <div className="flex justify-between text-xs font-medium tracking-wide">
                                            <span className="text-[var(--muted)]">Projected Monthly Earnings</span>
                                            <span className="font-serif text-[var(--foreground)]">$0.00</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium tracking-wide">
                                            <span className="text-[var(--secondary)]">Projected Yearly Earnings</span>
                                            <span className="font-serif text-[var(--foreground)]">$0.00</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={handleAction}
                                        disabled={isPending || !amount || parseFloat(amount) <= 0 || (activeTab === 'withdraw' && lockInfo?.isLocked)}
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
                                            lockInfo?.isLocked ? `Locked until ${lockInfo.unlockTime.toLocaleDateString()}` : `Withdraw ${symbol}`
                                        )}
                                    </button>

                                    <p className="text-[10px] text-center text-[var(--muted)] mt-6 leading-relaxed uppercase tracking-wide opacity-70">
                                        By using this vault, you agree to the <span className="underline cursor-pointer hover:text-[var(--primary)] text-[var(--primary)]">Terms of Service</span> and understand the risks involved.
                                    </p>
                                </>
                            ) : (
                                /* Mock Vault - Coming Soon State */
                                <div className="py-8 text-center bg-[var(--surface-1)] rounded-2xl border border-[var(--borderSoft)]">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-[var(--muted)] mb-1 flex items-center justify-end gap-1 uppercase tracking-wide">
                                            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> Available y{symbol}
                                        </div>
                                        <div className="text-3xl font-serif font-bold text-[var(--foreground)] tracking-tight">
                                            ${Number(availableYield).toFixed(4)}
                                        </div>
                                        <div className="text-xs text-[var(--secondary)] mt-1 font-medium italic">
                                            Risk-free betting power
                                        </div>
                                    </div>        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-bold uppercase tracking-widest rounded-[14px] transition-all shadow-lg text-xs">
                                        View Active Vaults
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Additional Info Card */}
                        <div className="bg-[var(--surface-1)] rounded-[24px] border border-[var(--borderSoft)] p-6 backdrop-blur-sm shadow-sm">
                            <div className="flex items-start gap-4">
                                <Info className="w-5 h-5 text-[var(--primary)] mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[var(--foreground)] text-sm uppercase tracking-wider mb-2">About Steakhouse USDC</h4>
                                    <p className="text-xs text-[var(--secondary)] leading-relaxed font-medium">
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
