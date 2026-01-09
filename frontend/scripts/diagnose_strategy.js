
const { createPublicClient, http, parseAbi } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

const STRATEGY_ADDRESS = '0xBaFeB777b7a100F3f4ea407b70344715b6059dFB';

async function main() {
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http('https://rpc.sepolia.mantle.xyz')
    });

    console.log('Diagnosing Strategy:', STRATEGY_ADDRESS);

    const abi = parseAbi([
        'function market() view returns (address)',
        'function vault() view returns (address)',
        'function asset() view returns (address)',
        'function lockDuration() view returns (uint256)',
        'function authorizedMarkets(address) view returns (bool)'
    ]);

    try {
        const market = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'market'
        });
        console.log('Market Address:', market);

        const vault = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'vault'
        });
        console.log('Vault Address:', vault);

        const asset = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'asset'
        });
        console.log('Asset Address:', asset);

        const duration = await client.readContract({
            address: STRATEGY_ADDRESS,
            abi,
            functionName: 'lockDuration'
        });
        console.log('Lock Duration:', duration.toString());

        // Check Auth
        const isAuthorized = await client.readContract({
            address: vault,
            abi,
            functionName: 'authorizedMarkets',
            args: [market]
        });
        console.log('Is Market Authorized in Vault?', isAuthorized);

        if (!isAuthorized) {
            console.error('CRITICAL: Market is NOT authorized in YieldVault. This will cause reverts!');
        } else {
            console.log('Market authorization looks good.');
        }

    } catch (e) {
        console.error('Error reading contract:', e);
    }
}

main();
