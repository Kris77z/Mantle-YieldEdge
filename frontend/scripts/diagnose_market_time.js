
const { createPublicClient, http, parseAbi } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

const STRATEGY_ADDRESS = '0xBaFeB777b7a100F3f4ea407b70344715b6059dFB';

async function main() {
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http('https://rpc.sepolia.mantle.xyz')
    });

    const abi = parseAbi([
        'function market() view returns (address)',
        'function getMarketInfo() view returns (string, uint8, uint8, uint256, uint256, uint256)'
    ]);

    try {
        const marketAddress = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'market'
        });
        console.log('Market Address:', marketAddress);

        const marketInfo = await client.readContract({
            address: marketAddress,
            abi,
            functionName: 'getMarketInfo'
        });

        // Return tuple: [question, status, outcome, totalYes, totalNo, closesAt]
        const status = marketInfo[1];
        const closesAt = marketInfo[5];
        const now = Math.floor(Date.now() / 1000);

        console.log('Market Status:', status); // 0 = Open
        console.log('Closes At:', closesAt.toString());
        console.log('Current Time:', now);

        if (now >= Number(closesAt)) {
            console.error('CRITICAL: Market is EXPIRED! Strategy will revert.');
        } else {
            console.log('Market is active and not expired.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
