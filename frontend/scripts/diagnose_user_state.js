
const { createPublicClient, http, parseAbi, formatEther } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

const STRATEGY_ADDRESS = '0xBaFeB777b7a100F3f4ea407b70344715b6059dFB';
const USDY_ADDRESS = '0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7';
const USER_ADDRESS = '0xC438Fa8069269668417A2157fed6e501e1224014'; // From screenshot

async function main() {
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http('https://rpc.sepolia.mantle.xyz')
    });

    console.log('Diagnosing User State:', USER_ADDRESS);

    const abi = parseAbi([
        'function balanceOf(address) view returns (uint256)',
        'function allowance(address, address) view returns (uint256)'
    ]);

    try {
        // Check Balance
        const balance = await client.readContract({
            address: USDY_ADDRESS,
            abi,
            functionName: 'balanceOf',
            args: [USER_ADDRESS]
        });
        console.log('User Balance:', formatEther(balance), 'USDY');

        // Check Allowance for Strategy
        const allowance = await client.readContract({
            address: USDY_ADDRESS,
            abi,
            functionName: 'allowance',
            args: [USER_ADDRESS, STRATEGY_ADDRESS]
        });
        console.log('Allowance for Strategy:', formatEther(allowance), 'USDY');

        const required = BigInt('1000000000000000000000'); // 1000
        if (allowance < required) {
            console.error('CRITICAL: Allowance is less than 1000! Deposit will revert.');
        } else {
            console.log('Allowance is sufficient.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
