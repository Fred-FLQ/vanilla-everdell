import { gameState } from "./game-state.js";

export const drawRandomCards = cardsQuantity => {
    let randomCards = [];

    for (let i = 1; i <= cardsQuantity; i++) {
        // Handling empty deck
        if (gameState.mainDeck.length === 0) {
            throw new Error('Deck is empty');
        }

        // Get a random card
        let randomNumber = Math.floor(Math.random() * gameState.mainDeck.length);
        let randomCard = gameState.mainDeck[randomNumber];

        // Edge Case Handling: corrupted initial data
        if (randomCard.count === undefined) randomCard.count = 1;

        if (randomCard.count === 1) {
            gameState.mainDeck.splice(randomNumber, 1); // Remove the card from deck if only 1 of a kind left
        } else {
            randomCard.count -= 1;
        }
        // Add a unique ID to drawn card
        randomCard.id = crypto.randomUUID();

        randomCards.push(randomCard);

    }
    return randomCards;
}