// Contract addresses on Mantle Sepolia (Chain ID: 5003)
export const CONTRACTS = {
    MOCK_USDY: '0x1f0434fc0489f0738f76ff5d12ea99d9db27f59d',
    YIELD_VAULT: '0x35ae7655e22eae17ba671b9bfc58e20b9796e4d0',
    PREDICTION_MARKET: '0xe6751db8348fad3865dd05cd20b48025671fd406',
} as const;

export const CHAIN_ID = 5003;

// Contract ABIs (simplified for frontend use)
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
        name: 'exchangeRate',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
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
        name: 'fastForwardDays',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'days_', type: 'uint256' }],
        outputs: [],
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
            { name: 'choice', type: 'uint8' },
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
        inputs: [{ name: '', type: 'address' }],
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
    {
        name: 'totalYesStake',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalNoStake',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'question',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'closesAt',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'status',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;
