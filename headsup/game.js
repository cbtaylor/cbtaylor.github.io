       // Initialize game state
        const gameState = {
            deck: [],
            computerCardValues: [],
            suits: ['H', 'D', 'C', 'S'],
            values: ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'],
            communityCards: [],
            playerCards: []
        };

        // Value rankings for comparing hands
        const valueRankings = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
            'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        // Create a fresh deck of cards
        function createDeck() {
            gameState.deck = [];
            for (let suit of gameState.suits) {
                for (let value of gameState.values) {
                    gameState.deck.push(value + suit);
                }
            }
        }

        // Shuffle the deck
        function shuffleDeck() {
            for (let i = gameState.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
            }
        }


// Deal cards to both players
function dealCards() {
    // Create and shuffle deck
    createDeck();
    shuffleDeck();

    // Reset computer's cards to face down
    const computerCards = document.getElementById('computerCards');
    computerCards.innerHTML = '';
    gameState.computerCardValues = [];
    for (let i = 0; i < 2; i++) {
        const card = gameState.deck.pop();
        gameState.computerCardValues.push(card);
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `<img src="cards/back_blue.png" alt="Card Back">`;
        computerCards.appendChild(cardElement);
    }

    // Deal two cards to player (face down initially)
    const playerCards = document.getElementById('playerCards');
    playerCards.innerHTML = '';
    gameState.playerCards = [];
    for (let i = 0; i < 2; i++) {
        const card = gameState.deck.pop();
        gameState.playerCards.push(card);
        const cardElement = document.createElement('div');
        cardElement.className = 'card card-back';
        cardElement.setAttribute('data-card', card); // Store card value as data attribute
        playerCards.appendChild(cardElement);
    }

    // Add 5 face-down community card placeholders
    const communityCards = document.getElementById('communityCards');
    communityCards.innerHTML = '';
    gameState.communityCards = [];
    for (let i = 0; i < 5; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card card-back';
        communityCards.appendChild(cardElement);
    }

    // Reset all buttons to initial state
    document.getElementById('dealButton').disabled = true;
    document.getElementById('showButton').disabled = true;
    document.getElementById('evaluateButton').disabled = true;
    document.getElementById('flopButton').disabled = false;
    document.getElementById('turnButton').disabled = true;
    document.getElementById('riverButton').disabled = true;

    // Remove any existing result display
    const existingResult = document.getElementById('result-display');
    if (existingResult) {
        existingResult.remove();
    }

    // Reveal player's cards after a short delay
    setTimeout(() => {
        const playerCardElements = playerCards.children;
        for (let i = 0; i < playerCardElements.length; i++) {
            const cardElement = playerCardElements[i];
            const cardValue = cardElement.getAttribute('data-card');
            cardElement.className = 'card';
            cardElement.innerHTML = `<img src="cards/${cardValue}.png" alt="${cardValue}">`;
        }
        // Enable deal button
        document.getElementById('dealButton').disabled = false;
    }, 1000);
}

// Show computer's cards
function showComputerCards() {
    const computerCards = document.getElementById('computerCards');
    const cardElements = computerCards.children;
    
    // Reveal computer's cards one by one
    for (let i = 0; i < gameState.computerCardValues.length; i++) {
        const card = gameState.computerCardValues[i];
        setTimeout(() => {
            cardElements[i].className = 'card';
            cardElements[i].innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
        }, i * 500); // Add delay between each card reveal
    }

    // Disable show button after revealing
    document.getElementById('showButton').disabled = true;

    // Enable evaluate button if all community cards are dealt
    if (gameState.communityCards.length === 5) {
        document.getElementById('evaluateButton').disabled = false;
    }
}

// Deal the flop (three community cards)
function dealFlop() {
    const communityCards = document.getElementById('communityCards').children;
    
    // Deal three cards
    for (let i = 0; i < 3; i++) {
        const card = gameState.deck.pop();
        gameState.communityCards.push(card);
        
        // Reveal card with animation after a delay
        setTimeout(() => {
            communityCards[i].className = 'card';
            communityCards[i].innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
        }, i * 500);
    }
    
    // Update button states
    document.getElementById('flopButton').disabled = true;
    document.getElementById('turnButton').disabled = false;
}

// Deal the turn (fourth community card)
function dealTurn() {
    const communityCards = document.getElementById('communityCards').children;
    
    // Deal one card
    const card = gameState.deck.pop();
    gameState.communityCards.push(card);
    
    // Reveal the fourth card with animation
    setTimeout(() => {
        communityCards[3].className = 'card';
        communityCards[3].innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
    }, 500);
    
    // Update button states
    document.getElementById('turnButton').disabled = true;
    document.getElementById('riverButton').disabled = false;
}

// Deal the river (fifth community card)
function dealRiver() {
    const communityCards = document.getElementById('communityCards').children;
    
    // Deal one card
    const card = gameState.deck.pop();
    gameState.communityCards.push(card);
    
    // Reveal the fifth card with animation
    setTimeout(() => {
        communityCards[4].className = 'card';
        communityCards[4].innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
        
        // Only enable the show button after the last card is revealed
        document.getElementById('showButton').disabled = false;
    }, 500);
    
    // Update button states
    document.getElementById('riverButton').disabled = true;
}

// Evaluate hands and display winner
function evaluateAndDisplayWinner() {
    const playerHand = [...gameState.playerCards, ...gameState.communityCards];
    const computerHand = [...gameState.computerCardValues, ...gameState.communityCards];
    
    const playerScore = evaluateHand(playerHand);
    const computerScore = evaluateHand(computerHand);
    
    // Create result display
    const resultDisplay = document.createElement('div');
    resultDisplay.id = 'result-display';
    resultDisplay.style.position = 'fixed';
    resultDisplay.style.top = '50%';
    resultDisplay.style.left = '50%';
    resultDisplay.style.transform = 'translate(-50%, -50%)';
    resultDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    resultDisplay.style.padding = '20px';
    resultDisplay.style.borderRadius = '10px';
    resultDisplay.style.color = 'white';
    resultDisplay.style.fontSize = '20px';
    resultDisplay.style.textAlign = 'center';
    resultDisplay.style.zIndex = '1000';
    
    // Compare hands and determine winner
    let resultText = `Player: ${playerScore.name}<br>Computer: ${computerScore.name}<br><br>`;
    
    if (playerScore.rank > computerScore.rank) {
        resultText += 'Player Wins!';
    } else if (computerScore.rank > playerScore.rank) {
        resultText += 'Computer Wins!';
    } else {
        // If same hand rank, do detailed comparison of all cards
        const comparison = compareEqualRankHands(playerScore, computerScore, playerHand, computerHand);
        if (comparison > 0) {
            resultText += 'Player Wins with higher cards!';
        } else if (comparison < 0) {
            resultText += 'Computer Wins with higher cards!';
        } else {
            resultText += "It's a Tie!";
        }
    }
    
    resultDisplay.innerHTML = resultText;
    document.querySelector('.game-container').appendChild(resultDisplay);
    
    // Disable evaluate button after showing result
    document.getElementById('evaluateButton').disabled = true;
    // Enable deal button for next round
    document.getElementById('dealButton').disabled = false;
}

// Evaluate a poker hand
function evaluateHand(cards) {
    const values = cards.map(card => card[0]);
    const suits = cards.map(card => card[1]);
    
    // Convert face cards to numerical values
    const numericValues = values.map(value => valueRankings[value]);
    
    // Check for each hand type from highest to lowest
    if (hasRoyalFlush(numericValues, suits)) {
        return { rank: 10, name: 'Royal Flush', highCard: 14 };
    }
    
    const straightFlush = hasStraightFlush(numericValues, suits);
    if (straightFlush.has) {
        return { rank: 9, name: 'Straight Flush', highCard: straightFlush.highCard };
    }
    
    const fourKind = hasFourOfAKind(numericValues);
    if (fourKind.has) {
        return { rank: 8, name: 'Four of a Kind', highCard: fourKind.highCard };
    }
    
    const fullHouse = hasFullHouse(numericValues);
    if (fullHouse.has) {
        return { rank: 7, name: 'Full House', highCard: fullHouse.highCard };
    }
    
    if (hasFlush(suits)) {
        return { rank: 6, name: 'Flush', highCard: Math.max(...numericValues) };
    }
    
    const straight = hasStraight(numericValues);
    if (straight.has) {
        return { rank: 5, name: 'Straight', highCard: straight.highCard };
    }
    
    const threeKind = hasThreeOfAKind(numericValues);
    if (threeKind.has) {
        return { rank: 4, name: 'Three of a Kind', highCard: threeKind.highCard };
    }
    
    const twoPair = hasTwoPair(numericValues);
    if (twoPair.has) {
        return { rank: 3, name: 'Two Pair', highCard: twoPair.highCard };
    }
    
    const pair = hasPair(numericValues);
    if (pair.has) {
        return { rank: 2, name: 'Pair', highCard: pair.highCard };
    }
    
    return { rank: 1, name: 'High Card', highCard: Math.max(...numericValues) };
}

// Helper functions for checking different poker hands
function hasRoyalFlush(values, suits) {
    const royalValues = [10, 11, 12, 13, 14];
    return hasStraightFlush(values, suits).has && 
           royalValues.every(value => values.includes(value));
}

function hasStraightFlush(values, suits) {
    // Group cards by suit
    const suitGroups = {};
    suits.forEach((suit, i) => {
        if (!suitGroups[suit]) {
            suitGroups[suit] = [];
        }
        suitGroups[suit].push(values[i]);
    });
    
    // Check each suit group for a straight
    for (let suit in suitGroups) {
        const suitValues = suitGroups[suit];
        if (suitValues.length >= 5) {  // Only check if we have enough cards of this suit
            const sortedValues = [...new Set(suitValues)].sort((a, b) => a - b);
            let maxLength = 1;
            let currentLength = 1;
            let highCard = sortedValues[0];
            
            for (let i = 1; i < sortedValues.length; i++) {
                if (sortedValues[i] === sortedValues[i-1] + 1) {
                    currentLength++;
                    if (currentLength > maxLength) {
                        maxLength = currentLength;
                        highCard = sortedValues[i];
                    }
                } else {
                    currentLength = 1;
                }
            }
            
            // Check for Ace-low straight flush
            if (sortedValues.includes(14) && sortedValues.includes(2) && 
                sortedValues.includes(3) && sortedValues.includes(4) && 
                sortedValues.includes(5)) {
                return { has: true, highCard: 5 };
            }
            
            if (maxLength >= 5) {
                return { has: true, highCard: highCard };
            }
        }
    }
    
    return { has: false, highCard: 0 };
}

function hasFourOfAKind(values) {
    const counts = getCounts(values);
    for (const [value, count] of Object.entries(counts)) {
        if (count === 4) {
            return { has: true, highCard: parseInt(value) };
        }
    }
    return { has: false, highCard: 0 };
}

function hasFullHouse(values) {
    const counts = getCounts(values);
    let threeValue = 0;
    let pairValue = 0;
    
    for (const [value, count] of Object.entries(counts)) {
        if (count === 3) threeValue = parseInt(value);
        if (count === 2) pairValue = parseInt(value);
    }
    
    return {
        has: threeValue > 0 && pairValue > 0,
        highCard: threeValue
    };
}

function hasFlush(suits) {
    const suitCounts = getCounts(suits);
    return Object.values(suitCounts).some(count => count >= 5);
}

function hasStraight(values) {
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    let maxLength = 1;
    let currentLength = 1;
    let highCard = uniqueValues[0];
    
    for (let i = 1; i < uniqueValues.length; i++) {
        if (uniqueValues[i] === uniqueValues[i-1] + 1) {
            currentLength++;
            if (currentLength > maxLength) {
                maxLength = currentLength;
                highCard = uniqueValues[i];
            }
        } else {
            currentLength = 1;
        }
    }
    
    // Check for Ace-low straight (A,2,3,4,5)
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && 
        uniqueValues.includes(3) && uniqueValues.includes(4) && 
        uniqueValues.includes(5)) {
        return { has: true, highCard: 5 };
    }
    
    return {
        has: maxLength >= 5,
        highCard: highCard
    };
}

function hasThreeOfAKind(values) {
    const counts = getCounts(values);
    for (const [value, count] of Object.entries(counts)) {
        if (count === 3) {
            return { has: true, highCard: parseInt(value) };
        }
    }
    return { has: false, highCard: 0 };
}

function hasTwoPair(values) {
    const counts = getCounts(values);
    const pairs = Object.entries(counts)
        .filter(([_, count]) => count === 2)
        .map(([value, _]) => parseInt(value))
        .sort((a, b) => b - a);
    
    return {
        has: pairs.length >= 2,
        highCard: pairs[0]
    };
}

function hasPair(values) {
    const counts = getCounts(values);
    for (const [value, count] of Object.entries(counts)) {
        if (count === 2) {
            return { has: true, highCard: parseInt(value) };
        }
    }
    return { has: false, highCard: 0 };
}

// Compare hands of equal rank
function compareEqualRankHands(playerScore, computerScore, playerHand, computerHand) {
    const playerValues = playerHand.map(card => valueRankings[card[0]]);
    const computerValues = computerHand.map(card => valueRankings[card[0]]);
    
    switch (playerScore.rank) {
        case 8: // Four of a Kind
            return compareFourOfAKind(playerValues, computerValues);
        case 7: // Full House
            return compareFullHouse(playerValues, computerValues);
        case 6: // Flush
            return compareFlush(playerValues, computerValues);
        case 5: // Straight
            return playerScore.highCard - computerScore.highCard;
        case 4: // Three of a Kind
            return compareThreeOfAKind(playerValues, computerValues);
        case 3: // Two Pair
            return compareTwoPair(playerValues, computerValues);
        case 2: // One Pair
            return compareOnePair(playerValues, computerValues);
        case 1: // High Card
            return compareHighCard(playerValues, computerValues);
        default:
            return playerScore.highCard - computerScore.highCard;
    }
}

function compareFourOfAKind(playerValues, computerValues) {
    const playerCounts = getCounts(playerValues);
    const computerCounts = getCounts(computerValues);
    
    // Get the four of a kind values
    const playerQuad = Number(Object.entries(playerCounts).find(([_, count]) => count === 4)[0]);
    const computerQuad = Number(Object.entries(computerCounts).find(([_, count]) => count === 4)[0]);
    
    if (playerQuad !== computerQuad) {
        return playerQuad - computerQuad;
    }
    
    // Compare kickers
    const playerKicker = Number(Object.entries(playerCounts).find(([_, count]) => count === 1)[0]);
    const computerKicker = Number(Object.entries(computerCounts).find(([_, count]) => count === 1)[0]);
    return playerKicker - computerKicker;
}

function compareFullHouse(playerValues, computerValues) {
    const playerCounts = getCounts(playerValues);
    const computerCounts = getCounts(computerValues);
    
    // Get the three of a kind values
    const playerTrips = Number(Object.entries(playerCounts).find(([_, count]) => count === 3)[0]);
    const computerTrips = Number(Object.entries(computerCounts).find(([_, count]) => count === 3)[0]);
    
    if (playerTrips !== computerTrips) {
        return playerTrips - computerTrips;
    }
    
    // Compare pair values
    const playerPair = Number(Object.entries(playerCounts).find(([_, count]) => count === 2)[0]);
    const computerPair = Number(Object.entries(computerCounts).find(([_, count]) => count === 2)[0]);
    return playerPair - computerPair;
}

function compareFlush(playerValues, computerValues) {
    const sortedPlayer = [...playerValues].sort((a, b) => b - a);
    const sortedComputer = [...computerValues].sort((a, b) => b - a);
    
    // Compare each card from highest to lowest
    for (let i = 0; i < 5; i++) {
        if (sortedPlayer[i] !== sortedComputer[i]) {
            return sortedPlayer[i] - sortedComputer[i];
        }
    }
    return 0;
}

function compareThreeOfAKind(playerValues, computerValues) {
    const playerCounts = getCounts(playerValues);
    const computerCounts = getCounts(computerValues);
    
    // Compare three of a kind values
    const playerTrips = Number(Object.entries(playerCounts).find(([_, count]) => count === 3)[0]);
    const computerTrips = Number(Object.entries(computerCounts).find(([_, count]) => count === 3)[0]);
    
    if (playerTrips !== computerTrips) {
        return playerTrips - computerTrips;
    }
    
    // Get kickers in descending order
    const playerKickers = Object.entries(playerCounts)
        .filter(([_, count]) => count === 1)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    const computerKickers = Object.entries(computerCounts)
        .filter(([_, count]) => count === 1)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    
    // Compare kickers
    for (let i = 0; i < playerKickers.length; i++) {
        if (playerKickers[i] !== computerKickers[i]) {
            return playerKickers[i] - computerKickers[i];
        }
    }
    return 0;
}

function compareTwoPair(playerValues, computerValues) {
    const playerCounts = getCounts(playerValues);
    const computerCounts = getCounts(computerValues);
    
    // Get pairs in descending order
    const playerPairs = Object.entries(playerCounts)
        .filter(([_, count]) => count === 2)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    const computerPairs = Object.entries(computerCounts)
        .filter(([_, count]) => count === 2)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    
    // Compare higher pair
    if (playerPairs[0] !== computerPairs[0]) {
        return playerPairs[0] - computerPairs[0];
    }
    
    // Compare lower pair
    if (playerPairs[1] !== computerPairs[1]) {
        return playerPairs[1] - computerPairs[1];
    }
    
    // Compare kicker
    const playerKicker = Number(Object.entries(playerCounts).find(([_, count]) => count === 1)[0]);
    const computerKicker = Number(Object.entries(computerCounts).find(([_, count]) => count === 1)[0]);
    return playerKicker - computerKicker;
}

function compareOnePair(playerValues, computerValues) {
    const playerCounts = getCounts(playerValues);
    const computerCounts = getCounts(computerValues);
    
    // Compare pair values
    const playerPair = Number(Object.entries(playerCounts).find(([_, count]) => count === 2)[0]);
    const computerPair = Number(Object.entries(computerCounts).find(([_, count]) => count === 2)[0]);
    
    if (playerPair !== computerPair) {
        return playerPair - computerPair;
    }
    
    // Get kickers in descending order
    const playerKickers = Object.entries(playerCounts)
        .filter(([_, count]) => count === 1)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    const computerKickers = Object.entries(computerCounts)
        .filter(([_, count]) => count === 1)
        .map(([value, _]) => Number(value))
        .sort((a, b) => b - a);
    
    // Compare each kicker
    for (let i = 0; i < playerKickers.length; i++) {
        if (playerKickers[i] !== computerKickers[i]) {
            return playerKickers[i] - computerKickers[i];
        }
    }
    return 0;
}

function compareHighCard(playerValues, computerValues) {
    const sortedPlayer = [...playerValues].sort((a, b) => b - a);
    const sortedComputer = [...computerValues].sort((a, b) => b - a);
    
    // Compare each card from highest to lowest
    for (let i = 0; i < 5; i++) {
        if (sortedPlayer[i] !== sortedComputer[i]) {
            return sortedPlayer[i] - sortedComputer[i];
        }
    }
    return 0;
}

// Utility function to count occurrences
function getCounts(array) {
    return array.reduce((counts, value) => {
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}
