// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PredictionMarket} from "./PredictionMarket.sol";
import {YieldVault} from "./YieldVault.sol";

/**
 * @title MarketFactory
 * @notice Factory contract for creating new prediction markets.
 * @dev Deploys PredictionMarket instances and manages the registry of all markets.
 */
contract MarketFactory {
    // ============ State Variables ============
    
    /// @notice The YieldVault contract that manages deposits
    YieldVault public immutable vault;
    
    /// @notice List of all deployed markets
    address[] public markets;
    
    /// @notice Mapping to check if an address is a valid market
    mapping(address => bool) public isMarket;
    
    /// @notice Owner of the factory
    address public owner;
    
    /// @notice Counter for market IDs
    uint256 public marketCount;

    // ============ Events ============
    
    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        string question,
        uint256 duration
    );

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "MarketFactory: not owner");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _vault) {
        vault = YieldVault(_vault);
        owner = msg.sender;
    }

    // ============ Factory Functions ============
    
    /**
     * @notice Create a new prediction market.
     * @param question The prediction question (e.g., "Will BTC reach $100k by Dec 31?").
     * @param duration How long the market accepts predictions (in seconds).
     * @return marketAddress The address of the newly created market.
     */
    function createMarket(
        string calldata question,
        uint256 duration
    ) external onlyOwner returns (address marketAddress) {
        require(bytes(question).length > 0, "MarketFactory: empty question");
        require(duration > 0, "MarketFactory: zero duration");
        
        // Deploy new market - msg.sender becomes the market owner
        PredictionMarket market = new PredictionMarket(
            address(vault),
            question,
            duration,
            msg.sender  // Market creator becomes owner
        );
        
        marketAddress = address(market);
        
        // Register the market
        markets.push(marketAddress);
        isMarket[marketAddress] = true;
        
        // Authorize the market in the vault
        vault.setMarketAuthorization(marketAddress, true);
        
        emit MarketCreated(marketCount, marketAddress, question, duration);
        
        marketCount++;
        
        return marketAddress;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get all deployed market addresses.
     * @return Array of market addresses.
     */
    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }
    
    /**
     * @notice Get market address by index.
     * @param index The index in the markets array.
     * @return The market address.
     */
    function getMarket(uint256 index) external view returns (address) {
        require(index < markets.length, "MarketFactory: invalid index");
        return markets[index];
    }
    
    /**
     * @notice Get total number of markets.
     * @return The count of markets.
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    /**
     * @notice Get market info in batch.
     * @param startIndex Start index.
     * @param count Number of markets to fetch.
     * @return marketAddresses Array of market addresses.
     * @return questions Array of market questions.
     * @return statuses Array of market statuses (0=Open, 1=Closed, 2=Resolved).
     */
    function getMarketsInfo(uint256 startIndex, uint256 count) external view returns (
        address[] memory marketAddresses,
        string[] memory questions,
        uint8[] memory statuses
    ) {
        uint256 end = startIndex + count;
        if (end > markets.length) {
            end = markets.length;
        }
        uint256 actualCount = end - startIndex;
        
        marketAddresses = new address[](actualCount);
        questions = new string[](actualCount);
        statuses = new uint8[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            address marketAddr = markets[startIndex + i];
            PredictionMarket market = PredictionMarket(marketAddr);
            
            marketAddresses[i] = marketAddr;
            questions[i] = market.question();
            statuses[i] = uint8(market.status());
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Transfer ownership.
     * @param newOwner The new owner address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MarketFactory: zero address");
        owner = newOwner;
    }
}
