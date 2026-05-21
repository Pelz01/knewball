// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KnewBallCup
/// @notice Locks football calls before kickoff and lets fans claim Ball IQ after resolution.
contract KnewBallCup {
    enum Winner {
        Home,
        Draw,
        Away
    }

    enum BinaryPick {
        No,
        Yes
    }

    enum GoalPick {
        Home,
        Away,
        None
    }

    enum TotalGoalsPick {
        Under,
        Over
    }

    struct MatchMeta {
        string homeTeam;
        string awayTeam;
        uint256 kickoffTime;
        bool exists;
    }

    struct MatchResult {
        uint8 homeScore;
        uint8 awayScore;
        Winner winner;
        GoalPick firstGoal;
        BinaryPick bothTeamsScored;
        TotalGoalsPick totalGoals;
        uint256 resolvedAt;
        bool resolved;
    }

    struct Prediction {
        Winner winner;
        uint8 homeScore;
        uint8 awayScore;
        TotalGoalsPick totalGoals;
        BinaryPick bothTeamsScored;
        GoalPick firstGoal;
        uint256 lockedAt;
        uint256 pointsEarned;
        bool exists;
        bool claimed;
    }

    address public owner;

    mapping(address => uint256) public totalBallIQ;
    mapping(uint256 => MatchMeta) public matches;
    mapping(uint256 => MatchResult) public results;
    mapping(uint256 => mapping(address => Prediction)) public predictions;

    event OwnershipTransferred(address indexed previousOwner, address indexed nextOwner);
    event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, uint256 kickoffTime);
    event PredictionSubmitted(address indexed wallet, uint256 indexed matchId, uint256 lockedAt);
    event MatchResolved(uint256 indexed matchId, uint8 homeScore, uint8 awayScore, uint256 resolvedAt);
    event BallIQClaimed(address indexed wallet, uint256 indexed matchId, uint256 points);

    error AlreadyClaimed();
    error AlreadyPredicted();
    error InvalidOwner();
    error InvalidScore();
    error KickoffPassed();
    error KickoffPending();
    error MatchAlreadyExists();
    error MatchAlreadyResolved();
    error MatchMissing();
    error MatchNotResolved();
    error PredictionMissing();
    error Unauthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) revert InvalidOwner();

        address previousOwner = owner;
        owner = nextOwner;
        emit OwnershipTransferred(previousOwner, nextOwner);
    }

    function createMatch(
        uint256 matchId,
        string calldata homeTeam,
        string calldata awayTeam,
        uint256 kickoffTime
    ) external onlyOwner {
        if (matches[matchId].exists) revert MatchAlreadyExists();
        if (kickoffTime <= block.timestamp) revert KickoffPassed();

        matches[matchId] = MatchMeta({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            kickoffTime: kickoffTime,
            exists: true
        });

        emit MatchCreated(matchId, homeTeam, awayTeam, kickoffTime);
    }

    function submitPrediction(
        uint256 matchId,
        Winner winner,
        uint8 homeScore,
        uint8 awayScore,
        TotalGoalsPick totalGoals,
        BinaryPick bothTeamsScored,
        GoalPick firstGoal
    ) external {
        MatchMeta memory matchMeta = matches[matchId];
        if (!matchMeta.exists) revert MatchMissing();
        if (block.timestamp >= matchMeta.kickoffTime) revert KickoffPassed();
        if (predictions[matchId][msg.sender].exists) revert AlreadyPredicted();

        predictions[matchId][msg.sender] = Prediction({
            winner: winner,
            homeScore: homeScore,
            awayScore: awayScore,
            totalGoals: totalGoals,
            bothTeamsScored: bothTeamsScored,
            firstGoal: firstGoal,
            lockedAt: block.timestamp,
            pointsEarned: 0,
            exists: true,
            claimed: false
        });

        emit PredictionSubmitted(msg.sender, matchId, block.timestamp);
    }

    function resolveMatch(
        uint256 matchId,
        uint8 homeScore,
        uint8 awayScore,
        GoalPick firstGoal
    ) external onlyOwner {
        MatchMeta memory matchMeta = matches[matchId];
        if (!matchMeta.exists) revert MatchMissing();
        if (block.timestamp < matchMeta.kickoffTime) revert KickoffPending();
        if (results[matchId].resolved) revert MatchAlreadyResolved();
        if (homeScore == 0 && awayScore == 0 && firstGoal != GoalPick.None) revert InvalidScore();
        if ((homeScore > 0 || awayScore > 0) && firstGoal == GoalPick.None) revert InvalidScore();

        Winner winner = _winner(homeScore, awayScore);
        BinaryPick bothTeamsScored = homeScore > 0 && awayScore > 0 ? BinaryPick.Yes : BinaryPick.No;
        TotalGoalsPick totalGoals = homeScore + awayScore > 2 ? TotalGoalsPick.Over : TotalGoalsPick.Under;

        results[matchId] = MatchResult({
            homeScore: homeScore,
            awayScore: awayScore,
            winner: winner,
            firstGoal: firstGoal,
            bothTeamsScored: bothTeamsScored,
            totalGoals: totalGoals,
            resolvedAt: block.timestamp,
            resolved: true
        });

        emit MatchResolved(matchId, homeScore, awayScore, block.timestamp);
    }

    function claimBallIQ(uint256 matchId) external returns (uint256 points) {
        Prediction storage prediction = predictions[matchId][msg.sender];
        MatchResult memory result = results[matchId];

        if (!prediction.exists) revert PredictionMissing();
        if (!result.resolved) revert MatchNotResolved();
        if (prediction.claimed) revert AlreadyClaimed();

        bool exactScore = prediction.homeScore == result.homeScore && prediction.awayScore == result.awayScore;
        uint8 correctCount = 0;

        if (prediction.winner == result.winner) {
            points += 50;
            correctCount += 1;
        }
        if (exactScore) {
            points += 200;
            correctCount += 1;
        }
        if (prediction.totalGoals == result.totalGoals) {
            points += 40;
            correctCount += 1;
        }
        if (prediction.bothTeamsScored == result.bothTeamsScored) {
            points += 40;
            correctCount += 1;
        }
        if (prediction.firstGoal == result.firstGoal) {
            points += 60;
            correctCount += 1;
        }

        if (correctCount == 5) {
            points += 200;
        } else if (correctCount == 4) {
            points += 100;
        } else if (correctCount == 3) {
            points += 50;
        }

        prediction.claimed = true;
        prediction.pointsEarned = points;
        totalBallIQ[msg.sender] += points;

        emit BallIQClaimed(msg.sender, matchId, points);
    }

    function getPrediction(uint256 matchId, address wallet) external view returns (Prediction memory) {
        return predictions[matchId][wallet];
    }

    function getResult(uint256 matchId) external view returns (MatchResult memory) {
        return results[matchId];
    }

    function _winner(uint8 homeScore, uint8 awayScore) private pure returns (Winner) {
        if (homeScore > awayScore) return Winner.Home;
        if (homeScore < awayScore) return Winner.Away;
        return Winner.Draw;
    }
}
