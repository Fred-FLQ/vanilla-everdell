import { gameState } from "./game-state.js";
import { getDeckLength } from "./everdell-idb.js";

const drawRandomCards = cardsQuantity => {
    let randomCards = [];

    for (let i = 1; i <= cardsQuantity; i++) {
        // Handling empty deck
        if (gameState.mainDeck.length === 0) {  // [IDB] Needs an IDB.count() transaction
            throw new Error('Deck is empty');
        }

        // Get a random card
        let randomNumber = Math.floor(Math.random() * gameState.mainDeck.length);
        let randomCard = gameState.mainDeck[randomNumber]; // [IDB] Needs an IDB cursor + advance(randomNumber)

        // Edge Case Handling: corrupted initial data
        if (randomCard.count === undefined) randomCard.count = 1;

        if (randomCard.count === 1) {
            gameState.mainDeck.splice(randomNumber, 1); // Remove the card from deck if only 1 of a kind left
        } else {
            randomCard.count -= 1;
        }
        // Add a unique ID to drawn card
        let drawnCard = { ...randomCard, id: crypto.randomUUID() };

        randomCards.push(drawnCard);
    }
    return randomCards;
}

// Add cards to area
const addCardToArea = (card, area) => {
    area.push(card);
}

// Replenish Meadow
function replenishMeadow() {
    if (gameState.meadow.length < 8) {
        let newCard = drawRandomCards(1);
        newCard.forEach(card => addCardToArea(card, gameState.meadow));
    }
}

export { drawRandomCards, addCardToArea, replenishMeadow };