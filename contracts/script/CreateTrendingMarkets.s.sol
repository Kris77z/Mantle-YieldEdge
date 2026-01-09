// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "forge-std/console.sol";

interface IMarketFactory {
    function createMarket(string memory question, uint256 duration) external returns (address);
}

contract CreateTrendingMarkets is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddr = 0x49B30Fa07a0437491584828B3D77E7891CDecb5d;
        IMarketFactory factory = IMarketFactory(factoryAddr);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Creating market: Fed decreases interest rates by 50+ bps after January 2026 meeting?");
        try factory.createMarket("Fed decreases interest rates by 50+ bps after January 2026 meeting?", 1846804) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Fed increases interest rates by 25+ bps after January 2026 meeting?");
        try factory.createMarket("Fed increases interest rates by 25+ bps after January 2026 meeting?", 1846804) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Will the Indiana Pacers win the 2026 NBA Finals?");
        try factory.createMarket("Will the Indiana Pacers win the 2026 NBA Finals?", 15152404) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Maduro in U.S. custody by January 31?");
        try factory.createMarket("Maduro in U.S. custody by January 31?", 2106004) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Will Trump nominate Barron Trump as the next Fed chair?");
        try factory.createMarket("Will Trump nominate Barron Trump as the next Fed chair?", 30963604) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Will Trump nominate himself as the next Fed chair?");
        try factory.createMarket("Will Trump nominate himself as the next Fed chair?", 30963604) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: No change in Fed interest rates after January 2026 meeting?");
        try factory.createMarket("No change in Fed interest rates after January 2026 meeting?", 1846804) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Fed decreases interest rates by 25 bps after January 2026 meeting?");
        try factory.createMarket("Fed decreases interest rates by 25 bps after January 2026 meeting?", 1846804) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Khamenei out as Supreme Leader of Iran by January 31?");
        try factory.createMarket("Khamenei out as Supreme Leader of Iran by January 31?", 2106004) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        console.log("Creating market: Over $5M committed to the Infinex public sale?");
        try factory.createMarket("Over $5M committed to the Infinex public sale?", 31068004) {
             console.log("   Success");
        } catch Error(string memory reason) {
             console.log("   Failed:", reason);
        } catch {
             console.log("   Failed (unknown)");
        }

        vm.stopBroadcast();
    }
}
