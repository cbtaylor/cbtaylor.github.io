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
                cardElement.className = 'card card-back';
                computerCards.appendChild(cardElement);
            }

            // Deal two cards to player
            const playerCards = document.getElementById('playerCards');
            playerCards.innerHTML = '';
            gameState.playerCards = [];
            for (let i = 0; i < 2; i++) {
                const card = gameState.deck.pop();
                gameState.playerCards.push(card);
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
                playerCards.appendChild(cardElement);
            }

            // Reset all buttons to initial state
            document.getElementById('dealButton').disabled = true;
            document.getElementById('showButton').disabled = false;
            document.getElementById('evaluateButton').disabled = true;
            document.getElementById('flopButton').disabled = false;
            document.getElementById('turnButton').disabled = true;
            document.getElementById('riverButton').disabled = true;

            // Reset community cards
            gameState.communityCards = [];
            document.getElementById('communityCards').innerHTML = '';
            
            // Remove any existing result display
            const existingResult = document.getElementById('result-display');
            if (existingResult) {
                existingResult.remove();
            }
            
            // Enable deal button after 2 seconds
            setTimeout(() => {
                document.getElementById('dealButton').disabled = false;
            }, 2000);
        }

        // Show computer's cards
        function showComputerCards() {
            const computerCards = document.getElementById('computerCards');
            computerCards.innerHTML = '';
            
            // Show computer's cards face up
            for (let card of gameState.computerCardValues) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
                computerCards.appendChild(cardElement);
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
            const communityCards = document.getElementById('communityCards');
            
            // Deal three cards
            for (let i = 0; i < 3; i++) {
                const card = gameState.deck.pop();
                gameState.communityCards.push(card);
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
                communityCards.appendChild(cardElement);
            }
            
            // Update button states
            document.getElementById('flopButton').disabled = true;
            document.getElementById('turnButton').disabled = false;
        }

        // Deal the turn (fourth community card)
        function dealTurn() {
            const communityCards = document.getElementById('communityCards');
            
            // Deal one card
            const card = gameState.deck.pop();
            gameState.communityCards.push(card);
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
            communityCards.appendChild(cardElement);
            
            // Update button states
            document.getElementById('turnButton').disabled = true;
            document.getElementById('riverButton').disabled = false;
        }

        // Deal the river (fifth community card)
        function dealRiver() {
            const communityCards = document.getElementById('communityCards');
            
            // Deal one card
            const card = gameState.deck.pop();
            gameState.communityCards.push(card);
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `<img src="cards/${card}.png" alt="${card}">`;
            communityCards.appendChild(cardElement);
            
            // Update button states
            document.getElementById('riverButton').disabled = true;
            
            // Enable show computer's cards button if not already shown
            if (document.getElementById('showButton').disabled === false) {
                document.getElementById('showButton').disabled = false;
            }
            
            // Clear any previous results
            const existingResult = document.getElementById('result-display');
            if (existingResult) {
                existingResult.remove();
            }
            
            // Enable show computer's cards button if not already shown
            if (document.getElementById('showButton').disabled === false) {
                document.getElementById('showButton').disabled = false;
            }
        }