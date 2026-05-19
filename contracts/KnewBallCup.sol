// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

    struct FanProfile {
        string displayName;
        string country;
        string favoriteTeam;
        uint256 totalBallIQ;
        uint256 totalCalls;
        uint256 correctCalls;
        uint256 currentStreak;
        uint256 bestStreak;
        bool exists;
    }

    struct MatchResult {
        uint8 homeScore;
        uint8 awayScore;
        Winner winner;
        GoalPick firstGoal;
        BinaryPick bothTeamsScored;
        BinaryPick overUnder;
        bool resolved;
    }

    struct MatchMeta {
        string homeTeam;
        string awayTeam;
        uint256 kickoffTime;
        bool exists;
    }

    struct Prediction {
        Winner winner;
        uint8 homeScore;
        uint8 awayScore;
        BinaryPick overUnder;
        BinaryPick bothTeamsScored;
        GoalPick firstGoal;
        uint256 timestamp;
        bool exists;
        bool claimed;
        uint256 pointsEarned;
        string badgeEarned;
    }

    address public owner;
    mapping(address => FanProfile) public fanProfiles;
    mapping(uint256 => MatchMeta) public matches;
    mapping(uint256 => MatchResult) public results;
    mapping(uint256 => mapping(address => Prediction)) public predictions;

    event FanRegistered(address indexed wallet, string displayName, string country, string favoriteTeam);
    event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, uint256 kickoffTime);
    event PredictionSubmitted(address indexed wallet, uint256 indexed matchId, uint256 timestamp);
    event MatchResolved(uint256 indexed matchId, uint8 homeScore, uint8 awayScore);
    event BallIQClaimed(address indexed wallet, uint256 indexed matchId, uint256 points, string badge);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerFan(string calldata displayName, string calldata country, string calldata favoriteTeam) external {
        require(!fanProfiles[msg.sender].exists, "already registered");
        fanProfiles[msg.sender] = FanProfile({
            displayName: displayName,
            country: country,
            favoriteTeam: favoriteTeam,
            totalBallIQ: 0,
            totalCalls: 0,
            correctCalls: 0,
            currentStreak: 0,
            bestStreak: 0,
            exists: true
        });
        emit FanRegistered(msg.sender, displayName, country, favoriteTeam);
    }

    function createMatch(uint256 matchId, string calldata homeTeam, string calldata awayTeam, uint256 kickoffTime) external onlyOwner {
        require(!matches[matchId].exists, "match exists");
        matches[matchId] = MatchMeta(homeTeam, awayTeam, kickoffTime, true);
        emit MatchCreated(matchId, homeTeam, awayTeam, kickoffTime);
    }

    function submitPrediction(
        uint256 matchId,
        Winner winner,
        uint8 homeScore,
        uint8 awayScore,
        BinaryPick overUnder,
        BinaryPick bothTeamsScored,
        GoalPick firstGoal
    ) external {
        MatchMeta memory matchMeta = matches[matchId];
        require(matchMeta.exists, "match missing");
        require(block.timestamp < matchMeta.kickoffTime, "kickoff passed");
        require(!predictions[matchId][msg.sender].exists, "already submitted");

        predictions[matchId][msg.sender] = Prediction({
            winner: winner,
            homeScore: homeScore,
            awayScore: awayScore,
            overUnder: overUnder,
            bothTeamsScored: bothTeamsScored,
            firstGoal: firstGoal,
            timestamp: block.timestamp,
            exists: true,
            claimed: false,
            pointsEarned: 0,
            badgeEarned: ""
        });

        fanProfiles[msg.sender].totalCalls += 1;
        emit PredictionSubmitted(msg.sender, matchId, block.timestamp);
    }

    function resolveMatch(
        uint256 matchId,
        uint8 homeScore,
        uint8 awayScore,
        Winner winner,
        GoalPick firstGoal,
        BinaryPick bothTeamsScored,
        BinaryPick overUnder
    ) external onlyOwner {
        require(matches[matchId].exists, "match missing");
        require(!results[matchId].resolved, "already resolved");
        results[matchId] = MatchResult(homeScore, awayScore, winner, firstGoal, bothTeamsScored, overUnder, true);
        emit MatchResolved(matchId, homeScore, awayScore);
    }

    function claimBallIQ(uint256 matchId) external {
        Prediction storage prediction = predictions[matchId][msg.sender];
        MatchResult memory result = results[matchId];
        require(prediction.exists, "prediction missing");
        require(result.resolved, "not resolved");
        require(!prediction.claimed, "already claimed");

        uint256 points = 0;
        bool exactScore = prediction.homeScore == result.homeScore && prediction.awayScore == result.awayScore;
        bool perfect = prediction.winner == result.winner
            && exactScore
            && prediction.overUnder == result.overUnder
            && prediction.bothTeamsScored == result.bothTeamsScored
            && prediction.firstGoal == result.firstGoal;

        if (prediction.winner == result.winner) points += 50;
        if (exactScore) points += 200;
        if (prediction.overUnder == result.overUnder) points += 40;
        if (prediction.bothTeamsScored == result.bothTeamsScored) points += 40;
        if (prediction.firstGoal == result.firstGoal) points += 60;
        if (perfect) points += 150;

        string memory badge = perfect ? "Perfect Call" : exactScore ? "Knew Ball" : prediction.firstGoal == result.firstGoal ? "First Goal Caller" : "";
        prediction.claimed = true;
        prediction.pointsEarned = points;
        prediction.badgeEarned = badge;

        FanProfile storage profile = fanProfiles[msg.sender];
        profile.totalBallIQ += points;
        if (points > 0) {
            profile.correctCalls += 1;
            profile.currentStreak += 1;
            if (profile.currentStreak > profile.bestStreak) profile.bestStreak = profile.currentStreak;
        } else {
            profile.currentStreak = 0;
        }

        emit BallIQClaimed(msg.sender, matchId, points, badge);
    }
}
