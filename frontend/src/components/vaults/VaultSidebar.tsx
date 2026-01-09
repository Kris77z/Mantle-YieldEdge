'use client';

import React, { useState, useEffect } from 'react';
import { Info, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useDeposit,
    useWithdraw,
    useApproveToken,
    useTokenBalance,
    useDepositInfo,
    useCurrentAssetContracts
} from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useAsset } from '@/context/AssetContext';

interface VaultSidebarProps {
    vaultName?: string;
    apy?: string;
}

export function VaultSidebar({ vaultName = 'YieldEdge Vault', apy = '5.00' }: VaultSidebarProps) {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [needsApproval, setNeedsApproval] = useState(true);

    const { isConnected } = useAccount();
    const { assetConfig } = useAsset();
    const contracts = useCurrentAssetContracts();

    // Contract hooks
    const { data: balance, isLoading: isLoadingBalance } = useTokenBalance();
    const { data: depositInfo, isLoading: isLoadingDeposit, refetch: refetchDeposit } = useDepositInfo();
    const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveToken();
    const { deposit, isPending: isDepositing, isSuccess: depositSuccess, error: depositError } = useDeposit();
    const { withdraw, isPending: isWithdrawing, isSuccess: withdrawSuccess, error: withdrawError } = useWithdraw();

    // Format balance for display
    const displayBalance = balance ? parseFloat(formatEther(balance)).toFixed(2) : '0.00';
    const displayDeposit = depositInfo?.currentValue || '0.00';
    const currencySymbol = assetConfig.symbol.includes('USD') ? '$' : 'Ξ';

    // Calculate projections
    const amountNum = parseFloat(amount) || 0;
    const apyNum = parseFloat(apy) / 100;
    const monthlyEarnings = (amountNum * apyNum / 12).toFixed(2);
    const yearlyEarnings = (amountNum * apyNum).toFixed(2);

    // Handle approval success
    useEffect(() => {
        if (approveSuccess) {
            setNeedsApproval(false);
        }
    }, [approveSuccess]);

    // Handle deposit/withdraw success
    useEffect(() => {
        if (depositSuccess || withdrawSuccess) {
            setAmount('');
            refetchDeposit();
        }
    }, [depositSuccess, withdrawSuccess, refetchDeposit]);

    const handleAction = () => {
        if (!isConnected) return;

        if (activeTab === 'deposit') {
            if (needsApproval) {
                // First approve
                approve(parseEther(amount || '0'));
            } else {
                // Then deposit
                deposit(amount);
            }
        } else {
            withdraw();
        }
    };

    const isLoading = isApproving || isDepositing || isWithdrawing;
    const error = depositError || withdrawError;

    return (
        <div className="space-y-6">
            {/* Deposit / Withdraw Card */}
            <div className="bg-[var(--card)] backdrop-blur-md rounded-[32px] p-8 shadow-xl sticky top-28 border border-[var(--border)]">
                {/* Tabs */}
                <div className="flex bg-[rgba(255,255,255,0.4)] p-1.5 rounded-full mb-8">
                    <button
                        onClick={() => setActiveTab('deposit')}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                            activeTab === 'deposit'
                                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(148,116,147,0.2)]"
                                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                        )}
                    >
                        Deposit
                    </button>
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                            activeTab === 'withdraw'
                                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(148,116,147,0.2)]"
                                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                        )}
                    >
                        Withdraw
                    </button>
                </div>

                {/* Input Area */}
                <div className="space-y-4 mb-8">
                    <div className="bg-[rgba(255,255,255,0.6)] rounded-[24px] p-6 border border-[var(--borderSoft)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all">
                        <div className="flex justify-between text-xs text-[var(--muted)] mb-3 font-medium uppercase tracking-wider">
                            <span>Amount</span>
                            <span className="flex items-center gap-1">
                                {isLoadingBalance ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : activeTab === 'deposit' ? (
                                    <>Balance: {displayBalance} {assetConfig.symbol}</>
                                ) : (
                                    <>Deposited: {displayDeposit}</>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setNeedsApproval(true);
                                }}
                                placeholder="0"
                                disabled={activeTab === 'withdraw'}
                                className="bg-transparent text-3xl font-serif text-[var(--foreground)] flex-1 focus:outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={() => {
                                    if (activeTab === 'deposit' && balance) {
                                        setAmount(formatEther(balance));
                                    } else if (activeTab === 'withdraw' && depositInfo) {
                                        setAmount(depositInfo.currentValue);
                                    }
                                }}
                                className="text-xs text-[var(--primary)] font-bold hover:text-[var(--foreground)] transition-colors uppercase tracking-wider px-3 py-1 rounded-full bg-[rgba(148,116,147,0.1)] hover:bg-[rgba(148,116,147,0.2)]"
                            >
                                MAX
                            </button>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
                                <div className={`w-5 h-5 rounded-full ${assetConfig.symbol.includes('USD') ? 'bg-gradient-to-tr from-[#947493] to-[#302A30]' : 'bg-gradient-to-tr from-[#C8A166] to-[#8E8882]'}`}></div>
                                <span className="text-sm font-bold text-[var(--foreground)]">{assetConfig.symbol}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projection */}
                {activeTab === 'deposit' && (
                    <div className="space-y-4 mb-8">
                        <h4 className="font-serif text-lg text-[var(--foreground)] mb-4">Projections</h4>
                        <div className="flex justify-between text-sm py-2 border-b border-[var(--hairline)]">
                            <span className="text-[var(--secondary)]">Monthly Earnings</span>
                            <span className="font-medium text-[var(--foreground)]">{currencySymbol}{monthlyEarnings}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-[var(--hairline)]">
                            <span className="text-[var(--secondary)]">Yearly Earnings</span>
                            <span className="font-medium text-[var(--primary)]">{currencySymbol}{yearlyEarnings}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2">
                            <span className="text-[var(--secondary)]">Net APY</span>
                            <span className="font-medium text-[var(--primary)]">{apy}% ✨</span>
                        </div>
                    </div>
                )}

                {/* Withdraw Info */}
                {activeTab === 'withdraw' && depositInfo && (
                    <div className="space-y-4 mb-8 p-5 bg-[rgba(255,255,255,0.5)] rounded-[24px]">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--secondary)]">Principal</span>
                            <span className="font-medium text-[var(--foreground)]">{currencySymbol}{parseFloat(depositInfo.principal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--secondary)]">Accrued Yield</span>
                            <span className="font-medium text-[var(--primary)]">+{currencySymbol}{parseFloat(depositInfo.totalYield).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-3 border-t border-[var(--borderSoft)]">
                            <span className="text-[var(--foreground)] font-serif text-base">Total to Receive</span>
                            <span className="font-bold text-[var(--foreground)] text-lg">{currencySymbol}{parseFloat(depositInfo.currentValue).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-[#fff1f2] border border-[#fecdd3] rounded-2xl flex items-center gap-3 text-[#e11d48] text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>Transaction failed. Please try again.</span>
                    </div>
                )}

                {/* Success Display */}
                {(depositSuccess || withdrawSuccess) && (
                    <div className="mb-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl flex items-center gap-3 text-[#16a34a] text-sm">
                        <Check className="w-5 h-5 shrink-0" />
                        <span>{depositSuccess ? 'Deposit successful!' : 'Withdrawal successful!'}</span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    disabled={!isConnected || isLoading || (activeTab === 'deposit' && !amount)}
                    className={cn(
                        "w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2",
                        isConnected
                            ? "bg-[var(--primary)] hover:opacity-90 text-white shadow-[rgba(148,116,147,0.3)]"
                            : "bg-[#dcd4c7] text-[#8E8882] cursor-not-allowed shadow-none"
                    )}
                >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {!isConnected ? (
                        'Connect Wallet'
                    ) : activeTab === 'deposit' ? (
                        needsApproval && amount ? `Approve ${assetConfig.symbol}` : `Supply ${assetConfig.symbol}`
                    ) : (
                        'Withdraw All'
                    )}
                </button>

                <p className="text-[10px] text-center text-[var(--muted)] mt-6 leading-relaxed opacity-60">
                    By using this vault, you agree to the Terms of Service and understand the risks involved.
                </p>
            </div>

            {/* Additional Info Card */}
            <div className="bg-[rgba(148,116,147,0.05)] rounded-[24px] border border-[rgba(148,116,147,0.1)] p-6">
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[rgba(148,116,147,0.1)] flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h4 className="font-serif font-medium text-[var(--foreground)] text-base mb-2">About {vaultName}</h4>
                        <p className="text-sm text-[var(--secondary)] leading-relaxed">
                            This vault utilizes your yield for zero-loss predictions. Your principal is always protected - only accrued yield is used as betting stakes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contract Info */}
            <div className="px-6 py-2 text-[10px] text-[var(--muted)]/50 space-y-1 font-mono text-center">
                <div className="flex justify-between items-center bg-[var(--surface-1)] p-2 rounded-lg">
                    <span>Vault</span>
                    <span>{contracts.vault.slice(0, 6)}...{contracts.vault.slice(-4)}</span>
                </div>
            </div>
        </div>
    );
}
