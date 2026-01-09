
const { createPublicClient, http, parseAbi } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

const STRATEGY_ADDRESS = '0xBaFeB777b7a100F3f4ea407b70344715b6059dFB';

async function main() {
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http('https://rpc.sepolia.mantle.xyz')
    });

    const abi = parseAbi([
        'function targetOutcome() view returns (uint8)'
    ]);

    try {
        const outcome = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'targetOutcome'
        });
        console.log('Target Outcome:', outcome);

        if (outcome === 0) {
            console.error('CRITICAL: Target Outcome is 0 (Undecided). PredictionMarket will revert!');
        } else if (outcome === 1) {
            console.log('Target Outcome is 1 (Yes). OK.');
        } else if (outcome === 2) {
            console.log('Target Outcome is 2 (No). OK.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
