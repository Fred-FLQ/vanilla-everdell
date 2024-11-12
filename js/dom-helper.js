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
    },
    basicActionSpaces: {
        threeTwig: 0,
        twoTwigOneCard: 0
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

    // Place 8 random cards in meadow
    gameState.meadow = drawRandomCards(8);

    // Player gets 2 workers
    gameState.player.workers = 2;

    // Player draws 5 cards
    gameState.player.hand = drawRandomCards(5);
}

// New generic function to render counters
const renderCounter = async (counterState, containerElem) => {
    containerElem.textContent = counterState;
}

// New function to render cards in different context
const renderCards = async (cardsArray, containerElem) => {
    containerElem.innerHTML = ''; // Clear container before loading cards
    const renderCardsElem = containerElem;
    cardsArray.forEach(card => {
        const cardContainer = renderCardsElem.appendChild(document.createElement("article"));
        cardContainer.classList.add("card");
        const cardCostHTML = Object.keys(card.cost)
            .map(ressource => {
                return `<li>${ressource}: ${card.cost[ressource]}&nbsp;</li>`;
            })
            .join(''); // Remove ','
        card.produces = null; // Remove the "produces" part of the card for now
        cardContainer.innerHTML = `
            <header>
                <div class="category">${card.category}</div>
                <div class="name-type">
                    <h3 class="name">${card.name}</h3>
                    <span class="type">${card.unique === false ? `Common` : `Unique`} ${card.type}</p>
                </div>
                <div class="value">${card.value}</div>
            </header>
            <p class="effect">${card.effect}</p>
            <footer>
                <ul class="cost">${cardCostHTML}</ul>
                ${card.produces ? `<div class="produces">${card.produces}</div>` : ''}
            </footer>
    `
    })
};

const placeWorker = async (location) => {
    if (gameState.player.workers > 0) {
        gameState.player.workers -= 1;
        gameState.basicActionSpaces[location] += 1;
        renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
        renderCounter(gameState.basicActionSpaces[location], document.querySelector(`#${location} span`));
        getResources(location);
    } else {
        alert("You don't have enough workers.");
    }
}

const getResources = async (location) => {
    switch (location) {
        case 'threeTwig':
            gameState.player.resources.twig += 3;
            renderCounter(gameState.player.resources.twig, document.querySelector('#twigs span'));
            break;
        case 'twoTwigOneCard':
            gameState.player.resources.twig += 2;
            renderCounter(gameState.player.resources.twig, document.querySelector('#twigs span'));
            const newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
            break;
    }
}

gameInit();

// For testing
// window.renderPlayerWorkers = renderPlayerWorkers;
window.renderCounter = renderCounter;
window.renderCards = renderCards;
window.placeWorker = placeWorker;