import { drawRandomCards } from './game-helper.js';

// State Management
export const gameState = {
    mainDeck: [],
    meadow: [],
    discardDeck: [],
    player: {
        name: "Player",
        city: [],
        workers: 0,
        hand: [],
        points: 0,
        resources: {
            twig: 0,
            resin: 0,
            pebble: 0,
            berry: 0
        }
    }
};

// Fetch data from cards.json and populate gameState.mainDeck
const fetchCardsData = async () => {
    await fetch('/data/cards.json')
        .then(response => {
            if (!response.ok) {         // Reversed the logic for readability: making error the exception
                throw new Error('Network response failed.');
            }
            return response.json();
        })
        .then(cardsJson => {
            for (let card in cardsJson) {
                gameState.mainDeck.push({
                    name: card,
                    ...cardsJson[card]
                })
            }
        })
        .catch(error => console.error("Error fetching cards data:", error));
}

window.gameState = gameState; // [NEW] Make gameState globally accessible

const gameInit = async () => {
    await fetchCardsData();
    console.log(gameState.mainDeck.length);
    // Place 8 random cards in meadow
    gameState.meadow = drawRandomCards(8);
    // Player gets 2 workers
    gameState.player.workers = 2;

    // Player draws 5 cards
    gameState.player.hand = drawRandomCards(5);
}

const renderPlayerWorkers = async () => {
    const playerWorkersElem = document.querySelector('#player-workers span');
    playerWorkersElem.innerHTML = gameState.player.workers;
}

const renderPlayerHand = async () => {
    const playerHandElem = document.querySelector('#player-hand');
    gameState.player.hand.forEach(card => {
        const playerCard = playerHandElem.appendChild(document.createElement("div"));
        playerCard.innerHTML = card.name;
    })
}

const renderMeadow = async () => {
    const meadowElem = document.querySelector('#meadow');
    gameState.meadow.forEach(card => {
        const meadowCard = meadowElem.appendChild(document.createElement("div"));
        meadowCard.innerHTML = card.name;
    })
}

gameInit();

// For testing
window.renderPlayerWorkers = renderPlayerWorkers;
window.renderPlayerHand = renderPlayerHand;
window.renderMeadow = renderMeadow;