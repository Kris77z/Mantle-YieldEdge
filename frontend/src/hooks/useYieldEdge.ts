'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useAsset } from '@/context/AssetContext';
import {
    YIELD_VAULT_ABI,
    MOCK_USDY_ABI,
    PREDICTION_MARKET_ABI,
    MARKET_FACTORY_ABI
} from '@/config/contracts';

// ============ Utility Hooks ============

/**
 * Get contract addresses for current asset (Dynamic)
 */
export function useCurrentAssetContracts() {
    const { assetConfig } = useAsset();
    return assetConfig;
}

// ============ Mock Token Hooks ============

/**
 * Get user's Token balance (USDY/mETH)
 */
export function useTokenBalance() {
    const { address } = useAccount();
    const contracts = useCurrentAssetContracts();

    return useReadContract({
        address: contracts.address as `0x${string}`,
        abi: MOCK_USDY_ABI, // ABI is compatible for both USDY and mETH (ERC20-like)
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });
}

/**
 * Get user's allowance for vault spending
 */
export function useTokenAllowance() {
    const { address } = useAccount();
    const contracts = useCurrentAssetContracts();

    return useReadContract({
        address: contracts.address as `0x${string}`,
        abi: [
            {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' }
                ],
                outputs: [{ name: '', type: 'uint256' }],
            }
        ] as const,
        functionName: 'allowance',
        args: address ? [address, contracts.vault as `0x${string}`] : undefined,
        query: {
            enabled: !!address,
        },
    });
}

/**
 * Approve Token spending for vault
 */
export function useApproveToken() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const approve = (amount: bigint) => {
        writeContract({
            address: contracts.address as `0x${string}`,
            abi: MOCK_USDY_ABI,
            functionName: 'approve',
            args: [contracts.vault as `0x${string}`, amount],
        });
    };

    return { approve, isPending, isConfirming, isSuccess, error };
}

/**
 * Mint test Tokens (for testnet demo)
 */
export function useMintToken() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const mint = (amount: string) => {
        writeContract({
            address: contracts.address as `0x${string}`,
            abi: MOCK_USDY_ABI,
            functionName: 'mint',
            args: [contracts.address as `0x${string}`, parseEther(amount)],
        });
    };

    return { mint, isPending, isConfirming, isSuccess, error };
}

// ============ YieldVault Hooks ============

/**
 * Get user's deposit info from vault
 */
export function useDepositInfo() {
    const { address } = useAccount();
    const contracts = useCurrentAssetContracts();

    const result = useReadContract({
        address: contracts.vault as `0x${string}`,
        abi: YIELD_VAULT_ABI,
        functionName: 'getDepositInfo',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Parse the result into a more usable format
    const data = result.data ? {
        currentValue: formatEther(result.data[0]),
        principal: formatEther(result.data[1]),
        unlockedYield: formatEther(result.data[2]),
        lockedYield: formatEther(result.data[3]),
        // Calculate some derived values
        totalYield: formatEther(result.data[0] - result.data[1]),
        apy: result.data[1] > BigInt(0)
            ? ((Number(result.data[0] - result.data[1]) / Number(result.data[1])) * 100 * 365 / 30).toFixed(2)
            : '0.00',
    } : null;

    return { ...result, data };
}

/**
 * Get available yield for predictions
 */
export function useAvailableYield() {
    const { address } = useAccount();
    const contracts = useCurrentAssetContracts();

    const result = useReadContract({
        address: contracts.vault as `0x${string}`,
        abi: YIELD_VAULT_ABI,
        functionName: 'getAvailableYield',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    return {
        ...result,
        data: result.data ? formatEther(result.data) : '0',
    };
}

/**
 * Deposit into vault
 */
export function useDeposit() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const deposit = (amount: string) => {
        writeContract({
            address: contracts.vault as `0x${string}`,
            abi: YIELD_VAULT_ABI,
            functionName: 'deposit',
            args: [parseEther(amount)],
        });
    };

    return { deposit, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Flash Deposit into vault (Instant Yield)
 */
export function useFlashDeposit() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const flashDeposit = (amount: string, durationInDays: number) => {
        const durationSeconds = BigInt(durationInDays * 24 * 60 * 60);
        writeContract({
            address: contracts.vault as `0x${string}`,
            abi: YIELD_VAULT_ABI,
            functionName: 'flashDeposit',
            args: [parseEther(amount), durationSeconds],
        });
    };

    return { flashDeposit, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Withdraw from vault
 */
export function useWithdraw() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const withdraw = () => {
        writeContract({
            address: contracts.vault as `0x${string}`,
            abi: YIELD_VAULT_ABI,
            functionName: 'withdraw',
        });
    };

    return { withdraw, isPending, isConfirming, isSuccess, error, hash };
}

// ============ PredictionMarket Hooks ============

/**
 * Get market info
 */
export function useMarketInfo(marketAddress: string) {
    const result = useReadContract({
        address: marketAddress as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarketInfo',
        query: {
            enabled: !!marketAddress,
        },
    });

    const data = result.data ? {
        question: result.data[0],
        status: result.data[1], // 0 = Open, 1 = Closed, 2 = Resolved
        outcome: result.data[2], // 0 = Undecided, 1 = Yes, 2 = No
        totalYes: formatEther(result.data[3]),
        totalNo: formatEther(result.data[4]),
        closesAt: new Date(Number(result.data[5]) * 1000),
        // Derived
        totalPool: formatEther(result.data[3] + result.data[4]),
        yesPercentage: result.data[3] + result.data[4] > BigInt(0)
            ? (Number(result.data[3]) / Number(result.data[3] + result.data[4]) * 100).toFixed(1)
            : '50.0',
    } : null;

    return { ...result, data };
}

/**
 * Get user's prediction in a market
 */
export function useUserPrediction(marketAddress: string) {
    const { address } = useAccount();

    const result = useReadContract({
        address: marketAddress as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'predictions',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!marketAddress,
        },
    });

    const data = result.data ? {
        yieldStaked: formatEther(result.data[0]),
        choice: result.data[1], // 0 = None, 1 = Yes, 2 = No
        claimed: result.data[2],
        hasPosition: result.data[0] > BigInt(0),
    } : null;

    return { ...result, data };
}

/**
 * Make a prediction
 */
export function usePredict(marketAddress: string) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const predict = (choice: 'yes' | 'no', amount: string) => {
        writeContract({
            address: marketAddress as `0x${string}`,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'predict',
            args: [choice === 'yes' ? 1 : 2, parseEther(amount)],
            gas: BigInt(1000000000), // 1B gas for Mantle Sepolia L2
        });
    };

    return { predict, isPending, isConfirming, isSuccess, error, hash };
}


/**
 * Simulate yield by donating to vault (Testnet only)
 * This increases share price immediately
 */
export function useSimulateYield() {
    const contracts = useCurrentAssetContracts();
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const simulate = (amount: string = '10') => {
        writeContract({
            address: contracts.address as `0x${string}`, // Token Address (USDY/mETH)
            abi: MOCK_USDY_ABI, // ERC20 transfer
            functionName: 'transfer',
            args: [contracts.vault as `0x${string}`, parseEther(amount)], // Send to Vault
        });
    };

    return { simulate, isPending, isConfirming, isSuccess, error };
}

/**
 * Claim reward from resolved market
 */
export function useClaimReward(marketAddress: string) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const claim = () => {
        writeContract({
            address: marketAddress as `0x${string}`,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'claimReward',
        });
    };

    return { claim, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Calculate potential winnings
 */
export function usePotentialWinnings(marketAddress: string, choice: 'yes' | 'no', amount: string) {
    const result = useReadContract({
        address: marketAddress as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'calculatePotentialWinnings',
        args: [choice === 'yes' ? 1 : 2, parseEther(amount || '0')],
        query: {
            enabled: !!marketAddress && parseFloat(amount || '0') > 0,
        },
    });

    return {
        ...result,
        data: result.data ? formatEther(result.data) : '0',
    };
}

// ============ MarketFactory Hooks ============

/**
 * Get all markets
 */
export function useAllMarkets() {
    const contracts = useCurrentAssetContracts();

    return useReadContract({
        address: contracts.factory as `0x${string}`,
        abi: MARKET_FACTORY_ABI,
        functionName: 'getAllMarkets',
    });
}

/**
 * Get markets info in batch
 */
export function useMarketsInfo(startIndex: number = 0, count: number = 10) {
    const contracts = useCurrentAssetContracts();

    return useReadContract({
        address: contracts.factory as `0x${string}`,
        abi: MARKET_FACTORY_ABI,
        functionName: 'getMarketsInfo',
        args: [BigInt(startIndex), BigInt(count)],
    });
}
