
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

/**
 * @title GameContract
 * @dev A contract for playing coin flip and dice games using Chainlink VRF for randomness
 */
contract GameContract is Ownable, VRFConsumerBase {
    // Constants
    uint256 public constant HOUSE_EDGE_PERCENT = 25; // 2.5% house edge
    uint256 public constant HOUSE_EDGE_DENOMINATOR = 1000;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 5 ether;
    
    // Chainlink VRF variables
    bytes32 internal keyHash;
    uint256 internal fee;
    
    // Game type enum
    enum GameType { COIN_FLIP, DICE_ROLL }
    
    // Game result struct
    struct GameResult {
        address player;
        uint256 stake;
        uint256 payout;
        bool won;
        GameType gameType;
        uint8 playerChoice;
        uint8 outcome;
        uint256 timestamp;
    }
    
    // Player stats struct
    struct PlayerStats {
        uint256 totalGames;
        uint256 totalWagered;
        uint256 totalPayout;
        uint256 wins;
    }
    
    // Pending games mapping (requestId => GameInfo)
    struct GameInfo {
        address player;
        uint256 stake;
        GameType gameType;
        uint8 playerChoice;
    }
    
    mapping(bytes32 => GameInfo) public pendingGames;
    mapping(address => GameResult[]) public playerGameHistory;
    mapping(address => PlayerStats) public playerStats;
    
    // Events
    event GameStarted(address indexed player, uint256 stake, GameType gameType, uint8 playerChoice, bytes32 requestId);
    event CoinFlipResult(address indexed player, uint256 stake, uint256 payout, bool won, uint8 outcome);
    event DiceRollResult(address indexed player, uint256 stake, uint256 payout, bool won, uint8 prediction, uint8 outcome);
    
    /**
     * @dev Constructor for the GameContract
     * @param vrfCoordinator VRF Coordinator address
     * @param linkToken LINK token address
     * @param _keyHash VRF key hash
     * @param _fee VRF fee
     */
    constructor(
        address vrfCoordinator,
        address linkToken,
        bytes32 _keyHash,
        uint256 _fee
    ) 
        VRFConsumerBase(vrfCoordinator, linkToken)
        Ownable(msg.sender)
    {
        keyHash = _keyHash;
        fee = _fee;
    }
    
    /**
     * @dev Play a coin flip game
     * @param isHeads Whether the player chooses heads (true) or tails (false)
     */
    function playCoinFlip(bool isHeads) external payable returns (bytes32) {
        require(msg.value >= MIN_BET, "Bet amount below minimum");
        require(msg.value <= MAX_BET, "Bet amount above maximum");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");
        
        bytes32 requestId = requestRandomness(keyHash, fee);
        
        pendingGames[requestId] = GameInfo({
            player: msg.sender,
            stake: msg.value,
            gameType: GameType.COIN_FLIP,
            playerChoice: isHeads ? 1 : 0 // 1 for heads, 0 for tails
        });
        
        emit GameStarted(msg.sender, msg.value, GameType.COIN_FLIP, isHeads ? 1 : 0, requestId);
        
        return requestId;
    }
    
    /**
     * @dev Play a dice roll game
     * @param prediction The player's prediction (1-6)
     */
    function playDiceRoll(uint8 prediction) external payable returns (bytes32) {
        require(prediction >= 1 && prediction <= 6, "Prediction must be between 1 and 6");
        require(msg.value >= MIN_BET, "Bet amount below minimum");
        require(msg.value <= MAX_BET, "Bet amount above maximum");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");
        
        bytes32 requestId = requestRandomness(keyHash, fee);
        
        pendingGames[requestId] = GameInfo({
            player: msg.sender,
            stake: msg.value,
            gameType: GameType.DICE_ROLL,
            playerChoice: prediction
        });
        
        emit GameStarted(msg.sender, msg.value, GameType.DICE_ROLL, prediction, requestId);
        
        return requestId;
    }
    
    /**
     * @dev Callback function used by VRF Coordinator to return the random number
     * @param requestId ID of the request
     * @param randomness Random value
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        GameInfo memory game = pendingGames[requestId];
        
        if (game.gameType == GameType.COIN_FLIP) {
            processCoinFlipResult(requestId, game, randomness);
        } else if (game.gameType == GameType.DICE_ROLL) {
            processDiceRollResult(requestId, game, randomness);
        }
        
        delete pendingGames[requestId];
    }
    
    /**
     * @dev Process coin flip game result
     * @param requestId ID of the random request
     * @param game Game information
     * @param randomness Random value from VRF
     */
    function processCoinFlipResult(bytes32 requestId, GameInfo memory game, uint256 randomness) private {
        // Extract result (0 or 1) from randomness
        uint8 outcome = uint8(randomness % 2);
        bool won = (outcome == game.playerChoice);
        
        // Calculate payout with house edge
        uint256 payout = 0;
        if (won) {
            payout = (game.stake * (2 * HOUSE_EDGE_DENOMINATOR - HOUSE_EDGE_PERCENT)) / HOUSE_EDGE_DENOMINATOR;
        }
        
        // Update player stats
        updatePlayerStats(game.player, game.stake, payout, won);
        
        // Store game result
        playerGameHistory[game.player].push(GameResult({
            player: game.player,
            stake: game.stake,
            payout: payout,
            won: won,
            gameType: GameType.COIN_FLIP,
            playerChoice: game.playerChoice,
            outcome: outcome,
            timestamp: block.timestamp
        }));
        
        // Transfer winnings if player won
        if (won) {
            payable(game.player).transfer(payout);
        }
        
        // Emit event
        emit CoinFlipResult(game.player, game.stake, payout, won, outcome);
    }
    
    /**
     * @dev Process dice roll game result
     * @param requestId ID of the random request
     * @param game Game information
     * @param randomness Random value from VRF
     */
    function processDiceRollResult(bytes32 requestId, GameInfo memory game, uint256 randomness) private {
        // Extract result (1-6) from randomness
        uint8 outcome = uint8(randomness % 6) + 1;
        bool won = (outcome == game.playerChoice);
        
        // Calculate payout with house edge
        uint256 payout = 0;
        if (won) {
            // For dice, payout is 5.85x (6x minus house edge)
            payout = (game.stake * (6 * HOUSE_EDGE_DENOMINATOR - HOUSE_EDGE_PERCENT)) / HOUSE_EDGE_DENOMINATOR;
        }
        
        // Update player stats
        updatePlayerStats(game.player, game.stake, payout, won);
        
        // Store game result
        playerGameHistory[game.player].push(GameResult({
            player: game.player,
            stake: game.stake,
            payout: payout,
            won: won,
            gameType: GameType.DICE_ROLL,
            playerChoice: game.playerChoice,
            outcome: outcome,
            timestamp: block.timestamp
        }));
        
        // Transfer winnings if player won
        if (won) {
            payable(game.player).transfer(payout);
        }
        
        // Emit event
        emit DiceRollResult(game.player, game.stake, payout, won, game.playerChoice, outcome);
    }
    
    /**
     * @dev Update player statistics
     * @param player Player address
     * @param stake Stake amount
     * @param payout Payout amount
     * @param won Whether the player won
     */
    function updatePlayerStats(address player, uint256 stake, uint256 payout, bool won) private {
        PlayerStats storage stats = playerStats[player];
        stats.totalGames += 1;
        stats.totalWagered += stake;
        stats.totalPayout += payout;
        if (won) {
            stats.wins += 1;
        }
    }
    
    /**
     * @dev Get a player's statistics
     * @param player Player address
     * @return totalGames Total games played
     * @return totalWagered Total amount wagered
     * @return totalPayout Total amount paid out
     * @return wins Number of wins
     */
    function getPlayerStats(address player) external view returns (uint256, uint256, uint256, uint256) {
        PlayerStats memory stats = playerStats[player];
        return (stats.totalGames, stats.totalWagered, stats.totalPayout, stats.wins);
    }
    
    /**
     * @dev Get a player's game history length
     * @param player Player address
     * @return Number of games played
     */
    function getPlayerGameHistoryLength(address player) external view returns (uint256) {
        return playerGameHistory[player].length;
    }
    
    /**
     * @dev Get a specific game from a player's history
     * @param player Player address
     * @param index Index of the game in history
     * @return Game result struct
     */
    function getPlayerGameAtIndex(address player, uint256 index) external view returns (
        address, uint256, uint256, bool, GameType, uint8, uint8, uint256
    ) {
        require(index < playerGameHistory[player].length, "Index out of bounds");
        GameResult memory game = playerGameHistory[player][index];
        return (
            game.player,
            game.stake,
            game.payout,
            game.won,
            game.gameType,
            game.playerChoice,
            game.outcome,
            game.timestamp
        );
    }
    
    /**
     * @dev Withdraw LINK tokens from the contract
     * @param amount Amount to withdraw
     */
    function withdrawLink(uint256 amount) external onlyOwner {
        require(LINK.transfer(owner(), amount), "Unable to transfer");
    }
    
    /**
     * @dev Withdraw ETH from the contract
     * @param amount Amount to withdraw
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Amount exceeds balance");
        payable(owner()).transfer(amount);
    }
}
