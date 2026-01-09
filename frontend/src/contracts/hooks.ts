'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS, MOCK_USDY_ABI, YIELD_VAULT_ABI, PREDICTION_MARKET_ABI } from './config';

// Hook: Get user's mUSDY balance
export function useUsdyBalance() {
    const { address } = useAccount();

    return useReadContract({
        address: CONTRACTS.MOCK_USDY as `0x${string}`,
        abi: MOCK_USDY_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 5000,
        },
    });
}

// Hook: Get user's vault deposit info
export function useVaultInfo() {
    const { address } = useAccount();

    return useReadContract({
        address: CONTRACTS.YIELD_VAULT as `0x${string}`,
        abi: YIELD_VAULT_ABI,
        functionName: 'getDepositInfo',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 5000,
        },
    });
}

// Hook: Get market info
export function useMarketInfo() {
    return useReadContract({
        address: CONTRACTS.PREDICTION_MARKET as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarketInfo',
        query: {
            refetchInterval: 10000,
        },
    });
}

// Hook: Approve USDY for Vault
export function useApproveUsdy() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: string) => {
        writeContract({
            address: CONTRACTS.MOCK_USDY as `0x${string}`,
            abi: MOCK_USDY_ABI,
            functionName: 'approve',
            args: [CONTRACTS.YIELD_VAULT as `0x${string}`, parseEther(amount)],
        });
    };

    return { approve, isPending, isConfirming, isSuccess, error };
}

// Hook: Deposit to Vault
export function useDeposit() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const deposit = (amount: string) => {
        writeContract({
            address: CONTRACTS.YIELD_VAULT as `0x${string}`,
            abi: YIELD_VAULT_ABI,
            functionName: 'deposit',
            args: [parseEther(amount)],
        });
    };

    return { deposit, isPending, isConfirming, isSuccess, error };
}

// Hook: Withdraw from Vault
export function useWithdraw() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const withdraw = () => {
        writeContract({
            address: CONTRACTS.YIELD_VAULT as `0x${string}`,
            abi: YIELD_VAULT_ABI,
            functionName: 'withdraw',
        });
    };

    return { withdraw, isPending, isConfirming, isSuccess, error };
}

// Hook: Make prediction
export function usePredict() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const predict = (choice: 'yes' | 'no', amount: string) => {
        const choiceValue = choice === 'yes' ? 1 : 2; // 0=Undecided, 1=Yes, 2=No
        writeContract({
            address: CONTRACTS.PREDICTION_MARKET as `0x${string}`,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'predict',
            args: [choiceValue, parseEther(amount)],
        });
    };

    return { predict, isPending, isConfirming, isSuccess, error };
}

// Hook: Mint test USDY (for demo)
export function useMintUsdy() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    const { address } = useAccount();

    const mint = (amount: string) => {
        if (!address) return;
        writeContract({
            address: CONTRACTS.MOCK_USDY as `0x${string}`,
            abi: MOCK_USDY_ABI,
            functionName: 'mint',
            args: [address, parseEther(amount)],
        });
    };

    return { mint, isPending, isConfirming, isSuccess, error };
}

// Hook: Fast forward time (for demo)
export function useFastForward() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const fastForward = (days: number) => {
        writeContract({
            address: CONTRACTS.MOCK_USDY as `0x${string}`,
            abi: MOCK_USDY_ABI,
            functionName: 'fastForwardDays',
            args: [BigInt(days)],
        });
    };

    return { fastForward, isPending, isConfirming, isSuccess, error };
}

// Helper: Format balance from wei
export function formatBalance(value: bigint | undefined): string {
    if (!value) return '0.00';
    return parseFloat(formatEther(value)).toFixed(2);
}
