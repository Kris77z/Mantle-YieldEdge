// Contract addresses for YieldEdge protocol
// Update these after deploying to Mantle Sepolia

export const TOKEN_ICONS = {
    USDC: 'https://cdn.morpho.org/assets/logos/usdc.svg',
    WETH: 'https://cdn.morpho.org/assets/logos/weth.svg', // Also for mETH
    WBTC: 'https://cdn.morpho.org/assets/logos/wbtc.svg',
    wsrUSD: 'https://cdn.morpho.org/assets/logos/wsrusd.svg',
    sUSDS: 'https://cdn.morpho.org/assets/logos/susds.svg',
    wstETH: 'https://cdn.morpho.org/assets/logos/wsteth.svg',
    sUSDe: 'https://cdn.morpho.org/assets/logos/susde.svg',
    weETH: 'https://cdn.morpho.org/assets/logos/weeth.svg',
};

export const CONTRACTS = {
    // Mantle Sepolia (Chain ID: 5003) - Updated 2026-01-04
    mantleSepolia: {
        chainId: 5003,
        // Default stack (USDY) for backward compatibility
        mockUSDY: '0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7',
        yieldVault: '0x1676614C211795e3990Df2F4d7cc028C9B347ADF',
        marketFactory: '0xe4d8b0345e95604e98da4ba1d539407c58d02199', // Updated: Allows adding to positions

        strategies: {
            btcBull: {
                name: 'BTC Bull Run Enhanced',
                address: '0xBaFeB777b7a100F3f4ea407b70344715b6059dFB', // Deployed Step 2730
                description: 'Principal protected by USDY, Yield bets on BTC > $100k',
                apy: '15% ~ 500%',
                risk: 'Low'
            }
        },

        // Multi-Asset Configuration
        tokens: {
            usdy: {
                symbol: 'USDY',
                name: 'Ondo US Dollar Yield',
                address: '0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7',
                vault: '0x1676614C211795e3990Df2F4d7cc028C9B347ADF',
                factory: '0xe4d8b0345e95604e98da4ba1d539407c58d02199',
                decimals: 18,
                apy: '5.0%',
                icon: TOKEN_ICONS.USDC
            },
            meth: {
                symbol: 'mETH',
                name: 'Mantle Staked ETH',
                address: '0x7cD2749aB743540AB9E54507844467Fe95a0b395',
                vault: '0x2905e7A5FdBA5152B75e337b2cc4ebf1f0196FED',
                factory: '0xB0530e2C3D5b272007d150367169d106E77168d4',
                decimals: 18,
                apy: '3.8%',
                icon: TOKEN_ICONS.WETH
            }
        }
    },
    // Local development (Anvil)
    localhost: {
        chainId: 31337,
        mockUSDY: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        yieldVault: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        marketFactory: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
} as const;

// Get contract addresses for current chain
export function getContracts(chainId: number) {
    if (chainId === 5003) {
        return CONTRACTS.mantleSepolia;
    }
    return CONTRACTS.localhost;
}

// ABI exports will be generated from Foundry output
// For now, we define minimal ABIs for the functions we need

export const MOCK_USDY_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'mint',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'exchangeRate',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

export const YIELD_VAULT_ABI = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [],
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'flashDeposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'duration', type: 'uint256' }
        ],
        outputs: [],
    },
    {
        name: 'getDepositInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [
            { name: 'currentValue', type: 'uint256' },
            { name: 'principal', type: 'uint256' },
            { name: 'unlockedYield', type: 'uint256' },
            { name: 'lockedYield', type: 'uint256' },
        ],
    },
    {
        name: 'getAvailableYield',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export const PREDICTION_MARKET_ABI = [
    {
        name: 'predict',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'choice', type: 'uint8' }, // 1 = Yes, 2 = No
            { name: 'yieldAmount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'claimReward',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'getMarketInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: '_question', type: 'string' },
            { name: '_status', type: 'uint8' },
            { name: '_outcome', type: 'uint8' },
            { name: '_totalYes', type: 'uint256' },
            { name: '_totalNo', type: 'uint256' },
            { name: '_closesAt', type: 'uint256' },
        ],
    },
    {
        name: 'predictions',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [
            { name: 'yieldStaked', type: 'uint256' },
            { name: 'choice', type: 'uint8' },
            { name: 'claimed', type: 'bool' },
        ],
    },
    {
        name: 'calculatePotentialWinnings',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'choice', type: 'uint8' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export const MARKET_FACTORY_ABI = [
    {
        name: 'getAllMarkets',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address[]' }],
    },
    {
        name: 'getMarketCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'getMarketsInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'startIndex', type: 'uint256' },
            { name: 'count', type: 'uint256' },
        ],
        outputs: [
            { name: 'marketAddresses', type: 'address[]' },
            { name: 'questions', type: 'string[]' },
            { name: 'statuses', type: 'uint8[]' },
        ],
    },
] as const;

export const STRATEGY_VAULT_ABI = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [],
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'positions',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [
            { name: 'principalStaked', type: 'uint256' },
            { name: 'sharesMinted', type: 'uint256' },
        ],
    },
    {
        name: 'totalShares',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'lockDuration',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;
