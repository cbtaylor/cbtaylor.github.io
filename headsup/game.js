// Game state
const gameState = {
  playerStack: 1000,
  aiStack: 1000,
  potSize: 0,
  smallBlind: 5,
  bigBlind: 10,
  currentBet: 0,
  playerPosition: 'dealer', // 'dealer' (SB) or 'bb'
  gameStage: 'pre-game', // pre-game, pre-flop, flop, turn, river, showdown
  cards: [],
  handStrengths: {
    preflop: 0,
    flop: 0,
    turn: 0,
    river: 0
  },
  aiToAct: false,
  handComplete: true,
  lastRaiseAmount: 0, // Track the last raise amount for min-raise calculations
  playerBetAmount: 0,  // Track how much player has bet in current round
  aiBetAmount: 0       // Track how much AI has bet in current round
};

// Event listeners
document.getElementById('bet-slider').addEventListener('input', function() {
  document.getElementById('bet-amount').textContent = '$' + this.value;
});

// Initialize UI
updateUI();

function updateUI() {
  // Update stacks and pot
  document.getElementById('player-stack').textContent = '$' + gameState.playerStack;
  document.getElementById('ai-stack').textContent = '$' + gameState.aiStack;
  document.getElementById('pot-size').textContent = '$' + gameState.potSize;
  
  // Update hand stage
  document.getElementById('hand-stage').textContent = capitalize(gameState.gameStage);
  
  // Update betting controls visibility based on game state
  const newHandBtn = document.getElementById('new-hand-btn');
  const foldBtn = document.getElementById('fold-btn');
  const checkCallBtn = document.getElementById('check-call-btn');
  const betRaiseBtn = document.getElementById('bet-raise-btn');
  const completeBtn = document.getElementById('complete-btn');
  const betSliderContainer = document.getElementById('bet-slider-container');
  
  if (gameState.handComplete) {
    newHandBtn.classList.remove('hidden');
    foldBtn.classList.add('hidden');
    checkCallBtn.classList.add('hidden');
    betRaiseBtn.classList.add('hidden');
    completeBtn.classList.add('hidden');
    betSliderContainer.classList.add('hidden');
  } else {
    newHandBtn.classList.add('hidden');
    
    if (!gameState.aiToAct) {
      // Show appropriate buttons for player
      foldBtn.classList.remove('hidden');
      
      // Determine what the Check/Call button should say
      if (gameState.currentBet > gameState.playerBetAmount) {
        const callAmount = gameState.currentBet - gameState.playerBetAmount;
        checkCallBtn.textContent = "Call $" + callAmount;
      } else {
        checkCallBtn.textContent = "Check";
      }
      checkCallBtn.classList.remove('hidden');
      
      // Pre-flop, player is SB, and no bets yet - show Complete option
      if (gameState.gameStage === 'pre-flop' && 
          gameState.playerPosition === 'dealer' && 
          gameState.currentBet === gameState.bigBlind &&
          gameState.playerBetAmount === gameState.smallBlind) {
        completeBtn.textContent = "Complete $" + (gameState.bigBlind - gameState.smallBlind);
        completeBtn.classList.remove('hidden');
      } else {
        completeBtn.classList.add('hidden');
      }
      
      // Determine what the Bet/Raise button should say
      if (gameState.currentBet > gameState.playerBetAmount) {
        betRaiseBtn.textContent = "Raise";
      } else {
        betRaiseBtn.textContent = "Bet";
      }
      betRaiseBtn.classList.remove('hidden');
      
      // Update betting slider min and max values
      const betSlider = document.getElementById('bet-slider');
      betSlider.max = gameState.playerStack;
      
      // Set minimum bet/raise based on game rules
      let minBet;
      if (gameState.currentBet === 0) {
        // No previous bet - minimum is big blind
        minBet = gameState.bigBlind;
      } else if (gameState.currentBet > gameState.playerBetAmount) {
        // This is a raise - minimum is current bet + last raise (or big blind if no last raise)
        const minRaise = Math.max(gameState.lastRaiseAmount, gameState.bigBlind);
        minBet = gameState.currentBet + minRaise;
      } else {
        // This is a bet - minimum is big blind
        minBet = gameState.bigBlind;
      }
      
      // Set minimum value for slider (cap it at player's stack)
      betSlider.min = Math.min(minBet, gameState.playerStack);
      
      // Default value is minimum bet or a reasonable raise
      betSlider.value = Math.min(gameState.playerStack, minBet);
      document.getElementById('bet-amount').textContent = '$' + betSlider.value;
      
      betSliderContainer.classList.remove('hidden');
    } else {
      // Hide player controls when AI is acting
      foldBtn.classList.add('hidden');
      checkCallBtn.classList.add('hidden');
      betRaiseBtn.classList.add('hidden');
      completeBtn.classList.add('hidden');
      betSliderContainer.classList.add('hidden');
    }
  }
  
  // Update button states and AI cards based on game stage
  if (gameState.gameStage === 'showdown') {
    // Show AI cards at showdown
    for (let i = 3; i <= 4; i++) {
      const cardImage = document.getElementById('card-img' + i);
      if (gameState.cards && gameState.cards.length >= i) {
        cardImage.src = "cards/" + gameState.cards[i-1] + ".png";
      }
    }
  } else if (gameState.gameStage !== 'pre-game') {
    // Hide AI cards during play
    for (let i = 3; i <= 4; i++) {
      const cardImage = document.getElementById('card-img' + i);
      cardImage.src = "cards/back_red.png";
    }
  }
}

function fetchData() {
  // Reset game state for new hand
  gameState.potSize = 0;
  gameState.currentBet = 0;
  gameState.handComplete = false;
  gameState.lastRaiseAmount = 0;
  gameState.playerBetAmount = 0;
  gameState.aiBetAmount = 0;
  
  // Alternate positions
  gameState.playerPosition = gameState.playerPosition === 'dealer' ? 'bb' : 'dealer';
  
  // Set game stage
  gameState.gameStage = 'pre-flop';
  
  // Add blinds
  if (gameState.playerPosition === 'dealer') {
    // Player is dealer/small blind, AI is big blind
    gameState.playerStack -= gameState.smallBlind;
    gameState.aiStack -= gameState.bigBlind;
    gameState.potSize = gameState.smallBlind + gameState.bigBlind;
    gameState.currentBet = gameState.bigBlind;
    gameState.playerBetAmount = gameState.smallBlind;
    gameState.aiBetAmount = gameState.bigBlind;
    addToHistory("Player posts small blind: $" + gameState.smallBlind);
    addToHistory("AI posts big blind: $" + gameState.bigBlind);
    gameState.aiToAct = false; // Player acts first in pre-flop
  } else {
    // AI is dealer/small blind, player is big blind
    gameState.aiStack -= gameState.smallBlind;
    gameState.playerStack -= gameState.bigBlind;
    gameState.potSize = gameState.smallBlind + gameState.bigBlind;
    gameState.currentBet = gameState.bigBlind;
    gameState.playerBetAmount = gameState.bigBlind;
    gameState.aiBetAmount = gameState.smallBlind;
    addToHistory("AI posts small blind: $" + gameState.smallBlind);
    addToHistory("Player posts big blind: $" + gameState.bigBlind);
    gameState.aiToAct = true; // AI acts first in pre-flop
  }
  
  // Fetch card data
  fetch('https://cbtaylor.pythonanywhere.com/card')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      gameState.cards = data.cards;
      
      // Update player's hole cards and community cards
      for (let i = 1; i <= 2; i++) {
        const cardImage = document.getElementById('card-img' + i);
        cardImage.src = "cards/" + data.cards[i-1] + ".png";
      }
      
      // Set community cards based on game stage
      // For now, all cards are set to back side until revealed
      for (let i = 5; i <= 9; i++) {
        const cardImage = document.getElementById('card-img' + i);
        cardImage.src = "cards/back_red.png";
      }
      
      // Store hand values
      document.getElementById('handValue1').textContent = data.hand1;
      document.getElementById('handValue2').textContent = data.hand2;
      document.getElementById('winner').textContent = data.winner;
      
      // Update probabilities
      document.getElementById('preflop').textContent = data.preflop;
      document.getElementById('flop').textContent = data.flop;
      document.getElementById('turn').textContent = data.turn;
      document.getElementById('river').textContent = data.river;
      
      // Store hand strengths for AI decision making
      gameState.handStrengths.preflop = parseFloat(data.preflop);
      gameState.handStrengths.flop = parseFloat(data.flop);
      gameState.handStrengths.turn = parseFloat(data.turn);
      gameState.handStrengths.river = parseFloat(data.river);
      
      // Update UI
      updateUI();
      
      // If AI acts first, let AI make decision
      if (gameState.aiToAct) {
        setTimeout(aiAction, 1500);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      addToHistory("Error fetching data: " + error.message);
    });
}

function playerAction(action) {
  if (gameState.handComplete) return;
  
  let betAmount = 0;
  let allIn = false;
  let toCall = gameState.currentBet - gameState.playerBetAmount;
  
  switch(action) {
    case 'fold':
      addToHistory("Player folds");
      // AI wins the pot
      gameState.aiStack += gameState.potSize;
      gameState.handComplete = true;
      addToHistory("AI wins $" + gameState.potSize);
      break;
      
    case 'check':
      if (gameState.currentBet > gameState.playerBetAmount) {
        // This is a call
        betAmount = Math.min(toCall, gameState.playerStack);
        
        // Check if this is an all-in call
        if (betAmount >= gameState.playerStack) {
          allIn = true;
          addToHistory("Player calls $" + betAmount + " (ALL IN)");
        } else {
          addToHistory("Player calls $" + betAmount);
        }
        
        gameState.playerStack -= betAmount;
        gameState.potSize += betAmount;
        gameState.playerBetAmount += betAmount;
        
        // Player has called, so both players have bet the same amount this round
        // If player is all-in, go straight to showdown
        if (allIn) {
          goToShowdown();
          return;
        }
        
        // Otherwise move to the next stage if both players have acted
        advanceGameStage();
        return;
      } else {
        addToHistory("Player checks");
        
        // If AI has also checked (since playerBetAmount == aiBetAmount), move to next stage
        if (gameState.playerBetAmount === gameState.aiBetAmount && !gameState.aiToAct) {
          advanceGameStage();
          return;
        }
        
        // AI needs to act now
        gameState.aiToAct = true;
        setTimeout(aiAction, 1500);
      }
      break;
      
    case 'complete':
      // Complete the blind (add the difference between small and big blind)
      betAmount = gameState.bigBlind - gameState.smallBlind;
      addToHistory("Player completes to $" + gameState.bigBlind);
      
      gameState.playerStack -= betAmount;
      gameState.potSize += betAmount;
      gameState.playerBetAmount = gameState.bigBlind;
      
      // AI needs to act now
      gameState.aiToAct = true;
      setTimeout(aiAction, 1500);
      break;
      
    case 'raise':
      betAmount = parseInt(document.getElementById('bet-slider').value);
      
      // Calculate the actual amount being added to pot
      let actualBet = betAmount;
      
      // Ensure minimum bet rules are followed
      let minBet;
      if (gameState.currentBet === 0) {
        // This is an open - minimum is big blind
        minBet = gameState.bigBlind;
      } else {
        // This is a raise - minimum is current bet + last raise (or big blind if no last raise)
        const minRaise = Math.max(gameState.lastRaiseAmount, gameState.bigBlind);
        minBet = gameState.currentBet + minRaise;
      }
      
      // If selected bet is less than minimum, adjust it (shouldn't happen with slider constraints)
      if (actualBet < minBet && actualBet < gameState.playerStack) {
        actualBet = Math.min(minBet, gameState.playerStack);
      }
      
      // Calculate the amount being added to the pot
      let amountToAdd = actualBet - gameState.playerBetAmount;
      
      // Check if this is an all-in bet
      if (amountToAdd >= gameState.playerStack) {
        allIn = true;
        amountToAdd = gameState.playerStack;
        actualBet = gameState.playerBetAmount + amountToAdd;
        
        if (gameState.currentBet === 0) {
          addToHistory("Player bets $" + actualBet + " (ALL IN)");
        } else {
          addToHistory("Player raises to $" + actualBet + " (ALL IN)");
        }
      } else {
        if (gameState.currentBet === 0) {
          addToHistory("Player bets $" + actualBet);
        } else {
          addToHistory("Player raises to $" + actualBet);
        }
      }
      
      // Track the last raise amount
      gameState.lastRaiseAmount = actualBet - gameState.currentBet;
      
      // Update game state
      gameState.playerStack -= amountToAdd;
      gameState.potSize += amountToAdd;
      gameState.currentBet = actualBet;
      gameState.playerBetAmount = actualBet;
      
      // AI needs to act now
      gameState.aiToAct = true;
      setTimeout(aiAction, 1500);
      break;
  }
  
  // Update UI
  updateUI();
}

function aiAction() {
  if (gameState.handComplete) return;
  
  // AI decision based on hand strength and current bet
  let decision = '';
  let betAmount = 0;
  let decisionExplanation = '';
  let allIn = false;
  let toCall = gameState.currentBet - gameState.aiBetAmount;
  let handStrength = 0;
  
  // Get current hand strength based on stage
  switch(gameState.gameStage) {
    case 'pre-flop':
      handStrength = gameState.handStrengths.preflop;
      break;
    case 'flop':
      handStrength = gameState.handStrengths.flop;
      break;
    case 'turn':
      handStrength = gameState.handStrengths.turn;
      break;
    case 'river':
      handStrength = gameState.handStrengths.river;
      break;
  }
  
  // More advanced AI strategy based on hand strength
  if (gameState.currentBet === gameState.aiBetAmount) {
    // No bet to call - check or bet
    if (handStrength > 0.6 || Math.random() < 0.3) {
      // Strong hand or bluff - bet
      decision = 'raise';
      betAmount = Math.floor(gameState.bigBlind * (1 + handStrength * 5)); // Higher bet for stronger hand
      
      if (betAmount >= gameState.aiStack) {
        betAmount = gameState.aiStack;
        allIn = true;
        decisionExplanation = 'Going all-in for $' + betAmount + '!';
      } else {
        decisionExplanation = 'Betting $' + betAmount + '.';
      }
    } else {
      // Weak hand - check
      decision = 'check';
      decisionExplanation = 'Checking.';
    }
  } else {
    // Facing a bet - call, raise, or fold
    
    // Decision based on hand strength and pot odds
    const potOdds = toCall / (gameState.potSize + toCall);
    
    if (handStrength > 0.8) {
      // Very strong hand - raise
      decision = 'raise';
      let raiseAmount = Math.min(
        Math.floor(gameState.currentBet + gameState.lastRaiseAmount * 2), 
        gameState.aiStack
      );
      betAmount = raiseAmount;
      
      if (raiseAmount >= gameState.aiStack) {
        allIn = true;
        decisionExplanation = 'Raising all-in to $' + betAmount + '!';
      } else {
        decisionExplanation = 'Raising to $' + betAmount + '.';
      }
    } else if (handStrength > potOdds) {
      // Hand strength better than pot odds - call
      decision = 'call';
      betAmount = Math.min(toCall, gameState.aiStack);
      
      if (betAmount >= gameState.aiStack) {
        allIn = true;
        decisionExplanation = 'Calling $' + betAmount + ' (ALL IN).';
      } else {
        decisionExplanation = 'Calling $' + betAmount + '.';
      }
    } else {
      // Poor hand compared to pot odds - fold
      decision = 'fold';
      decisionExplanation = 'Folding.';
    }
  }
  
  // Show AI's thought process
  document.getElementById('ai-decision').textContent = decisionExplanation;
  
  // Implement the decision
  switch(decision) {
    case 'fold':
      addToHistory("AI folds");
      // Player wins the pot
      gameState.playerStack += gameState.potSize;
      gameState.handComplete = true;
      addToHistory("Player wins $" + gameState.potSize);
      break;
      
    case 'check':
      addToHistory("AI checks");
      
      // If both players have checked, move to next stage
      if (gameState.playerBetAmount === gameState.aiBetAmount) {
        advanceGameStage();
      } else {
        // AI's turn is done, now it's the player's turn
        gameState.aiToAct = false;
      }
      break;
      
    case 'call':
      // Calculate actual amount being called
      let amountToCall = Math.min(toCall, gameState.aiStack);
      
      // Check for all-in
      if (amountToCall >= gameState.aiStack) {
        allIn = true;
        addToHistory("AI calls $" + amountToCall + " (ALL IN)");
      } else {
        addToHistory("AI calls $" + amountToCall);
      }
      
      gameState.aiStack -= amountToCall;
      gameState.potSize += amountToCall;
      gameState.aiBetAmount += amountToCall;
      
      if (allIn) {
        // If AI is all-in, go straight to showdown
        goToShowdown();
        return;
      } else {
        // If this was a call to match player's bet, advance to next stage
        advanceGameStage();
      }
      break;
      
    case 'raise':
      // Calculate the amount being added to the pot
      let amountToAdd = betAmount - gameState.aiBetAmount;
      
      // Check for all-in
      if (amountToAdd >= gameState.aiStack) {
        amountToAdd = gameState.aiStack;
        betAmount = gameState.aiBetAmount + amountToAdd;
        allIn = true;
      }
      
      gameState.aiStack -= amountToAdd;
      gameState.potSize += amountToAdd;
      gameState.currentBet = betAmount;
      gameState.aiBetAmount = betAmount;
      
      // Track the last raise amount
      gameState.lastRaiseAmount = betAmount - Math.max(gameState.currentBet, gameState.aiBetAmount - amountToAdd);
      
      if (allIn) {
        addToHistory("AI raises to $" + betAmount + " (ALL IN)");
      } else {
        if (gameState.currentBet === 0) {
          addToHistory("AI bets $" + betAmount);
        } else {
          addToHistory("AI raises to $" + betAmount);
        }
      }
      
      // Player needs to act now
      gameState.aiToAct = false;
      break;
  }
  
  // Update UI
  updateUI();
}

function advanceGameStage() {
  // Reset betting info for new stage
  gameState.currentBet = 0;
  gameState.playerBetAmount = 0;
  gameState.aiBetAmount = 0;
  gameState.lastRaiseAmount = 0;
  
  // Move to the next stage of the hand
  switch(gameState.gameStage) {
    case 'pre-flop':
      gameState.gameStage = 'flop';
      addToHistory("--- FLOP ---");
      // Reveal flop cards
      for (let i = 5; i <= 7; i++) {
        const cardImage = document.getElementById('card-img' + i);
        cardImage.src = "cards/" + gameState.cards[i-1] + ".png";
      }
      break;
    case 'flop':
      gameState.gameStage = 'turn';
      addToHistory("--- TURN ---");
      // Reveal turn card
      const turnCardImage = document.getElementById('card-img8');
      turnCardImage.src = "cards/" + gameState.cards[7] + ".png";
      break;
    case 'turn':
      gameState.gameStage = 'river';
      addToHistory("--- RIVER ---");
      // Reveal river card
      const riverCardImage = document.getElementById('card-img9');
      riverCardImage.src = "cards/" + gameState.cards[8] + ".png";
      break;
    case 'river':
      gameState.gameStage = 'showdown';
      addToHistory("--- SHOWDOWN ---");
      handleShowdown();
      return;
  }
  
  // Determine who acts first in this round
  // In post-flop, the BB (out of position) acts first
  if (gameState.playerPosition === 'bb') {
    // Player is big blind, acts first in post-flop
    gameState.aiToAct = false;
  } else {
    // AI is big blind, acts first in post-flop
    gameState.aiToAct = true;
    setTimeout(aiAction, 1500);
  }
  
  // Update UI
  updateUI();
}

function goToShowdown() {
  // Move directly to showdown regardless of stage
  addToHistory("--- ALL IN - GOING TO SHOWDOWN ---");
  
  // Reveal all community cards
  if (gameState.gameStage === 'pre-flop') {
    addToHistory("--- FLOP, TURN AND RIVER DEALT ---");
    // Reveal flop, turn and river
    for (let i = 5; i <= 9; i++) {
      const cardImage = document.getElementById('card-img' + i);
      cardImage.src = "cards/" + gameState.cards[i-1] + ".png";
    }
  } else if (gameState.gameStage === 'flop') {
    addToHistory("--- TURN AND RIVER DEALT ---");
    // Reveal turn and river
    document.getElementById('card-img8').src = "cards/" + gameState.cards[7] + ".png";
    document.getElementById('card-img9').src = "cards/" + gameState.cards[8] + ".png";
  } else if (gameState.gameStage === 'turn') {
    addToHistory("--- RIVER DEALT ---");
    // Reveal river
    document.getElementById('card-img9').src = "cards/" + gameState.cards[8] + ".png";
  }
  
  // Set stage to showdown
  gameState.gameStage = 'showdown';
  
  // Handle the showdown
  handleShowdown();
}

function handleShowdown() {
  // Get the winner from the API data we already have
  const winner = document.getElementById('winner').textContent;
  
  if (winner === "Tie") {
    // Split pot
    const halfPot = Math.floor(gameState.potSize / 2);
    gameState.playerStack += halfPot;
    gameState.aiStack += gameState.potSize - halfPot; // Handle odd chips
    addToHistory("Pot split: Player and AI each win $" + halfPot);
  } else if (winner === "Player 1" || winner === "You") {
    // Player wins (You are Player 1)
    gameState.playerStack += gameState.potSize;
    addToHistory("Player wins $" + gameState.potSize + " with " + document.getElementById('handValue1').textContent);
  } else if (winner === "Player 2") {
    // AI wins (AI is Player 2)
    gameState.aiStack += gameState.potSize;
    addToHistory("AI wins $" + gameState.potSize + " with " + document.getElementById('handValue2').textContent);
  } else {
    // Fallback just in case
    console.log("Unexpected winner value:", winner);
    addToHistory("Game ended with unexpected result: " + winner);
  }
  
  // Hand is complete
  gameState.handComplete = true;
  updateUI();
}

function addToHistory(message) {
  const history = document.getElementById('action-history');
  const entry = document.createElement('div');
  entry.textContent = message;
  history.appendChild(entry);
  history.scrollTop = history.scrollHeight;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/-/g, ' ');
}
