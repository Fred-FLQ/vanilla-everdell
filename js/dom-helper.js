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
        twoTwigOneCard: 0,
        twoResin: 0,
        oneResinOneCard: 0,
        twoCardOnePoint: 0,
        onePebble: 0,
        oneBerryOneCard: 0,
        oneBerry: 0
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

const gameInit = async () => {
    await fetchCardsData();

    // Place 8 random cards in meadow
    gameState.meadow = drawRandomCards(8);

    // Player gets 2 workers
    gameState.player.workers = 2;

    // Player draws 5 cards
    gameState.player.hand = drawRandomCards(15);
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
        // Generate id element with card.id
        cardContainer.id = card.id;

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
        alert("You don't have any more workers.");
    }
}

// New function to increase victory points
const addPoints = (amount) => {
    gameState.player.points += amount;
    renderCounter(gameState.player.points, document.querySelector('#player-points span'));
}

// [DRY] New function to avoid repetitions in getResources() + easier to add resources and test game mechanics
const modifyResources = (resource, amount) => { // Quantity can be negative
    gameState.player.resources[resource] += amount;
    renderCounter(gameState.player.resources[resource], document.querySelector(`#${resource} span`));
}

const getResources = async (location) => {
    let newCards; // [WARNING] Need to declare it before hand because a switch statement does not create separate scopes for each case. 
    switch (location) {
        case 'threeTwig':
            modifyResources('twig', 3);
            break;
        case 'twoTwigOneCard':
            modifyResources('twig', 2);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
            break;
        case 'twoResin':
            modifyResources('resin', 2);
            break;
        case 'oneResinOneCard':
            modifyResources('resin', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
            break;
        case 'twoCardOnePoint':
            newCards = drawRandomCards(2);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
            addPoints(1);
            break;
        case 'onePebble':
            modifyResources('pebble', 1);
            break;
        case 'oneBerryOneCard':
            modifyResources('berry', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
            break;
        case 'oneBerry':
            modifyResources('berry', 1);
            break;
    }
}

const playCard = async (cardID, cardsArray) => {
    // loop through cards array until match cardID = card.id
    const selectedCard = cardsArray.find(card => card.id === cardID); // If true, returns matching card

    // If selected card is unique, check if already in city
    if (selectedCard.unique && gameState.player.city.find(card => card.name === selectedCard.name)) {
        console.log('You cannot have 2 unique identical cards.');
        return; // Exit if unique card already exists
    };

    // Check if player has enough resources
    const hasEnoughResources = Object.keys(selectedCard.cost).every(resource => gameState.player.resources[resource] >= selectedCard.cost[resource]);

    if (!hasEnoughResources) {
        console.log('Not enough resources to play this card.');
    } else {
        Object.keys(selectedCard.cost).forEach(resource => {
            modifyResources(resource, -selectedCard.cost[resource]);
        });
    };

    // Add played card to city and remove it from hand/meadow
    gameState.player.city.push(selectedCard);
    const selectedCardIndex = cardsArray.indexOf(selectedCard);
    cardsArray.splice(selectedCardIndex, 1);

    // WARNING!!! When I re-render, I lose my eventListener.
    renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
    renderCards(gameState.meadow, document.querySelector('#meadow .cards-grid'));
    renderCards(gameState.player.city, document.querySelector('#player-city .cards-grid'));
    // Quick fix test ==> [OPTIMIZE] Need to wrap those (above and below) in a function to avoid redundancy
    document.querySelectorAll("#player-hand .card").forEach(card => {
        card.onclick = () => playCard(card.id, gameState.player.hand);
    });
    document.querySelectorAll("#meadow .card").forEach(card => {
        card.onclick = () => playCard(card.id, gameState.meadow);
    });
};

gameInit().then(() => {
    renderCards(gameState.meadow, document.querySelector('#meadow .cards-grid'));
    renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
    renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
    // Add event listener to player.hand and meadow cards
    document.querySelectorAll("#player-hand .card").forEach(card => {
        card.onclick = () => playCard(card.id, gameState.player.hand);
    });
    document.querySelectorAll("#meadow .card").forEach(card => {
        card.onclick = () => playCard(card.id, gameState.meadow);
    });
})

// For testing
window.gameState = gameState;
// window.renderPlayerWorkers = renderPlayerWorkers;
// window.renderCounter = renderCounter;
// window.renderCards = renderCards;
window.placeWorker = placeWorker;
window.modifyResources = modifyResources;