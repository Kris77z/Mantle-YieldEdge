'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Loader2, AlertCircle, Check, TrendingUp, TrendingDown, Sparkles, Zap, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePredict, usePotentialWinnings, useAvailableYield, useFlashDeposit, useApproveToken, useTokenAllowance, useTokenBalance } from '@/hooks/useYieldEdge';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';

interface PredictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    marketAddress: string;
    marketTitle: string;
    initialChoice?: 'yes' | 'no';
    assetSymbol?: string;
}

export function PredictModal({
    isOpen,
    onClose,
    onSuccess,
    marketAddress,
    marketTitle,
    initialChoice = 'yes',
    assetSymbol = '$'
}: PredictModalProps) {
    const [choice, setChoice] = useState<'yes' | 'no'>(initialChoice);
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

    // Smart Zap State
    const [isZapMode, setIsZapMode] = useState(false);
    const [zapTargetYield, setZapTargetYield] = useState('');

    // Optimistic approval tracking - bypass RPC latency issues
    const [optimisticApproval, setOptimisticApproval] = useState<number>(0);

    const { isConnected, address } = useAccount();
    const { data: availableYield, refetch: refetchYield } = useAvailableYield();
    const { predict, isPending, isConfirming, isSuccess, error } = usePredict(marketAddress);
    const { data: potentialWinnings } = usePotentialWinnings(marketAddress, choice, amount);

    // Zap Hooks
    const { data: balance } = useTokenBalance();
    const { data: allowance, refetch: refetchAllowance } = useTokenAllowance();
    const { approve, isPending: isApproving, isConfirming: isApprovingConfirm, isSuccess: approveSuccess } = useApproveToken();
    const { flashDeposit, isPending: isFlashDepositing, isConfirming: isFlashConfirming, isSuccess: flashSuccess } = useFlashDeposit();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setChoice(initialChoice);
            setAmount('');
            setStep('input');
            setIsZapMode(false);
            setZapTargetYield('');
            setOptimisticApproval(0); // Reset optimistic state
        }
    }, [isOpen, initialChoice]);

    // Handle Predict success
    useEffect(() => {
        if (isSuccess) {
            setStep('success');
            onSuccess?.();
            toast.success('Prediction Placed!', { description: 'Good luck!' });
        }
    }, [isSuccess, onSuccess]);

    // Handle Zap Success
    useEffect(() => {
        if (flashSuccess) {
            setIsZapMode(false);
            setAmount(zapTargetYield); // Auto-fill the bet amount
            refetchYield(); // Update available yield
            toast.success('Flash Deposit Successful!', { description: 'You now have betting power.' });
        }
    }, [flashSuccess, zapTargetYield, refetchYield]);

    // Zap Calculations (moved up for use in approve effect)
    const ZAP_DURATION = 30;
    const ZAP_RATE = 0.50;
    const zapYieldValue = parseFloat(zapTargetYield || '0');
    const requiredPrincipal = zapYieldValue > 0
        ? (zapYieldValue / (ZAP_RATE * ZAP_DURATION / 365))
        : 0;

    // Handle Approve Success - Use OPTIMISTIC update
    useEffect(() => {
        if (approveSuccess) {
            toast.success('Approval Confirmed! Ready to Zap.');
            // Set optimistic approval to the amount we just approved
            setOptimisticApproval(requiredPrincipal);
            // Also try to refetch in background
            refetchAllowance();
        }
    }, [approveSuccess, requiredPrincipal, refetchAllowance]);

    const availableYieldValue = parseFloat(availableYield || '0');
    const amountValue = parseFloat(amount || '0');
    const potentialReturn = parseFloat(potentialWinnings || '0');
    const multiplier = amountValue > 0 ? (potentialReturn / amountValue).toFixed(2) : '1.00';
    const currency = assetSymbol.includes('USD') ? '$' : 'Ξ';

    // Zap Allowance Logic - Use optimistic value OR actual allowance, whichever is higher
    const balanceValue = balance ? parseFloat(formatEther(balance)) : 0;
    const allowanceFromRPC = allowance ? parseFloat(formatEther(allowance as bigint)) : 0;
    const allowanceVal = Math.max(allowanceFromRPC, optimisticApproval);
    const needsZapApproval = allowanceVal < requiredPrincipal;
    const hasInsufficientBalance = balanceValue < requiredPrincipal;

    // Debug: Log allowance data
    useEffect(() => {
        if (isZapMode) {
            console.log('[Zap Debug]', {
                rawAllowance: allowance,
                allowanceFromRPC,
                optimisticApproval,
                allowanceVal,
                requiredPrincipal,
                needsZapApproval
            });
        }
    }, [isZapMode, allowance, allowanceFromRPC, optimisticApproval, allowanceVal, requiredPrincipal, needsZapApproval]);

    const handlePredict = () => {
        if (amountValue <= 0 || amountValue > availableYieldValue) return;
        predict(choice, amount);
    };

    const handleMaxClick = () => {
        setAmount(availableYieldValue.toFixed(4));
    };

    const handleZap = () => {
        if (needsZapApproval) {
            approve(parseEther(requiredPrincipal.toString()));
        } else {
            flashDeposit(requiredPrincipal.toString(), ZAP_DURATION);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {isZapMode ? (
                            <>
                                <button onClick={() => setIsZapMode(false)} className="hover:bg-slate-200 p-1 rounded-full transition-colors">
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                </button>
                                Smart Zap
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">Flash Mode</span>
                            </>
                        ) : (
                            "Make Prediction"
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 'input' && !isZapMode && (
                        <>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{marketTitle}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setChoice('yes')}
                                    className={cn(
                                        "py-4 rounded-2xl font-bold text-lg transition-all border-2 flex items-center justify-center gap-2",
                                        choice === 'yes' ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30" : "bg-white text-green-600 border-green-200 hover:border-green-400"
                                    )}
                                >
                                    <TrendingUp className="w-5 h-5" /> YES
                                </button>
                                <button
                                    onClick={() => setChoice('no')}
                                    className={cn(
                                        "py-4 rounded-2xl font-bold text-lg transition-all border-2 flex items-center justify-center gap-2",
                                        choice === 'no' ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30" : "bg-white text-red-600 border-red-200 hover:border-red-400"
                                    )}
                                >
                                    <TrendingDown className="w-5 h-5" /> NO
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Yield to stake</span>
                                    <span>Available: {currency}{availableYieldValue.toFixed(4)}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-transparent text-2xl font-bold text-slate-900 flex-1 focus:outline-none placeholder:text-slate-300 w-full"
                                        />
                                        <button onClick={handleMaxClick} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-200">MAX</button>
                                    </div>
                                </div>
                            </div>

                            {/* Zap Promo / Insufficient Yield */}
                            {availableYieldValue <= 0 ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
                                        <AlertCircle className="w-5 h-5" /> No Betting Power
                                    </div>
                                    <p className="text-sm text-amber-700 mb-3">
                                        You need yield to bet. Use Smart Zap to lock principal and bet instantly.
                                    </p>
                                    <button
                                        onClick={() => setIsZapMode(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Zap className="w-4 h-4 fill-white" /> Get Instant Power
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsZapMode(true)}
                                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline ml-1"
                                >
                                    <Zap className="w-3 h-3" /> Need more power? Use Smart Zap
                                </button>
                            )}

                            <button
                                onClick={handlePredict}
                                disabled={!isConnected || isPending || isConfirming || amountValue <= 0 || amountValue > availableYieldValue}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                                    choice === 'yes' ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white",
                                    (!isConnected || isPending || isConfirming || amountValue <= 0 || amountValue > availableYieldValue) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {(isPending || isConfirming) ? <Loader2 className="w-5 h-5 animate-spin" /> : `Predict ${choice.toUpperCase()}`}
                            </button>
                        </>
                    )}

                    {/* ZAP MODE UI */}
                    {step === 'input' && isZapMode && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 fill-blue-600 text-blue-600" /> Flash Yield Generator
                                </h3>
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    Enter how much you want to BET. We'll verify how much principal you need to lock for 30 days to generate that yield instantly.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">I want to bet:</label>
                                    <div className="bg-white rounded-xl p-4 border border-slate-200 focus-within:border-blue-500 ring-4 ring-blue-50/50 transition-all">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={zapTargetYield}
                                                onChange={(e) => setZapTargetYield(e.target.value)}
                                                placeholder="0.00"
                                                className="bg-transparent text-2xl font-bold text-slate-900 flex-1 focus:outline-none w-full"
                                                autoFocus
                                            />
                                            <span className="text-slate-400 font-bold">{currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <ArrowRight className="text-slate-300 rotate-90" />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-slate-500">Required Principal Lock (30 Days)</span>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">50% Rate</span>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-slate-700">
                                        {requiredPrincipal > 0 ? `${currency}${requiredPrincipal.toFixed(2)}` : '---'}
                                    </div>
                                    {hasInsufficientBalance && (
                                        <div className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> Insufficient Balance ({balanceValue.toFixed(2)})
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleZap}
                                disabled={!zapYieldValue || hasInsufficientBalance || isApproving || isApprovingConfirm || isFlashDepositing || isFlashConfirming}
                                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {(isApproving || isApprovingConfirm) ? (
                                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Approving...</span>
                                ) : (isFlashDepositing || isFlashConfirming) ? (
                                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Flashing...</span>
                                ) : needsZapApproval ? (
                                    `Approve ${currency}${requiredPrincipal.toFixed(2)}`
                                ) : (
                                    `Zap & Lock Funds`
                                )}
                            </button>
                            <div className="text-[10px] text-slate-400 text-center mt-2">
                                Allowance: RPC={allowanceFromRPC.toFixed(2)} | Optimistic={optimisticApproval.toFixed(2)} | Required={requiredPrincipal.toFixed(2)}
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Prediction Placed!</h3>
                            <p className="text-slate-500 mb-6">You successfully bet {currency}{amountValue.toFixed(4)} on {choice.toUpperCase()}</p>
                            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">Done</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
