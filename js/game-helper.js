import { gameState } from "./dom-helper.js";

export const drawRandomCards = cardsQuantity => {
    let randomCards = [];

    for (let i = 1; i <= cardsQuantity; i++) {
        // Handling empty deck
        if (gameState.mainDeck.length === 0) {
            throw new Error('Deck is empty');
        }

        let randomNumber = Math.floor(Math.random() * gameState.mainDeck.length);
        let randomCard = gameState.mainDeck[randomNumber];

        // Accessing count property of randomCard - [NEW] Easier to use the static method Object.values()
        for (let key in randomCard) {
            let cardData = randomCard[key];

            if (cardData.count === undefined) cardData.count = 1; // Edge Case Handling: corrupted initial data

            if (cardData.count === 1) {
                gameState.mainDeck.splice(randomNumber, 1);
            } else {
                cardData.count -= 1;
            }

            randomCards.push(randomCard);
        }
    }
    return randomCards;
}