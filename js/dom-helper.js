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
    computer: {
        name: "Rugwort",
        city: [],
        points: 0
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
    await fetch('./data/cards.json')
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
    gameState.player.hand = drawRandomCards(5);

    //For testing
    // gameState.computer.city = drawRandomCards(3);
}

// Cards Rendering, updating and event listeners
// Render counters
const renderCounter = async (counterState, containerElem) => {
    containerElem.textContent = counterState;
}

// Render cards in context
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
            <header class="${card.category}">
                <div class="category">${card.category[0]}</div>
                <div class="name-type">
                    <h3 class="name">${card.name}</h3>
                    <span class="type">${card.unique === false ? `Common` : `Unique`} ${card.type}</p>
                </div>
                <div class="value">${card.value}</div>
            </header>
            <p class="effect">${card.effect}</p>
            <footer class="${card.category}">
                <ul class="cost">${cardCostHTML}</ul>
                ${card.produces ? `<div class="produces">${card.produces}</div>` : ''}
            </footer>
    `
    })
};

// Render and attach event listeners
const workersWithListeners = () => {
    document.querySelectorAll('#locations li').forEach((location) => {
        location.onclick = () => placeWorker(location.id);
    })
}

const renderPlayerHandWithListeners = () => {
    renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
    document.querySelectorAll('#player-hand .card').forEach(card => {
        card.onclick = () => playCard(card.id, gameState.player.hand);
    });
}

const renderMeadowWithListeners = () => {
    renderCards(gameState.meadow, document.querySelector('#meadow .cards-grid'));
    document.querySelectorAll('#meadow .card').forEach(card => {
        card.onclick = () => playCard(card.id, gameState.meadow);
    })
}

// Increase victory points
const addPoints = (amount) => {
    gameState.player.points += amount;
    renderCounter(gameState.player.points, document.querySelector('#player-points span'));
}

// Modify resources (avoid repetitions in getResources() + easier to add resources and test game mechanics)
const modifyResources = (resource, amount) => { // Quantity can be negative
    gameState.player.resources[resource] += amount;
    renderCounter(gameState.player.resources[resource], document.querySelector(`#${resource} span`));
}

const getResources = async (location) => {
    let newCards; // Need to declare it before hand because a switch statement does not create separate scopes for each case. 
    switch (location) {
        case 'threeTwig':
            modifyResources('twig', 3);
            break;
        case 'twoTwigOneCard':
            modifyResources('twig', 2);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderPlayerHandWithListeners();
            break;
        case 'twoResin':
            modifyResources('resin', 2);
            break;
        case 'oneResinOneCard':
            modifyResources('resin', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderPlayerHandWithListeners();
            break;
        case 'twoCardOnePoint':
            newCards = drawRandomCards(2);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderPlayerHandWithListeners();
            addPoints(1);
            break;
        case 'onePebble':
            modifyResources('pebble', 1);
            break;
        case 'oneBerryOneCard':
            modifyResources('berry', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderPlayerHandWithListeners();
            break;
        case 'oneBerry':
            modifyResources('berry', 1);
            break;
    }
}

// Players actions

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

const playCard = async (cardID, cardsArray) => {
    // Check how many cards in Player's city
    if (gameState.player.city.length === 15) {
        alert('You have reached the maximum number of cards in your city.');
        return;
    }

    // Loop through cards array until match cardID = card.id
    const selectedCard = cardsArray.find(card => card.id === cardID); // If true, returns matching card

    // If selected card is unique, check if already in city
    if (selectedCard.unique && gameState.player.city.find(card => card.name === selectedCard.name)) {
        alert('You cannot have 2 unique identical cards.');
        return; // Exit if unique card already exists
    };

    // Check if player has enough resources
    const hasEnoughResources = Object.keys(selectedCard.cost).every(resource => gameState.player.resources[resource] >= selectedCard.cost[resource]);

    if (!hasEnoughResources) {
        alert('Not enough resources to play this card.');
        return;
    } else {
        Object.keys(selectedCard.cost).forEach(resource => {
            modifyResources(resource, -selectedCard.cost[resource]);
        });
    };

    // Add played card to city and remove it from hand/meadow
    gameState.player.city.push(selectedCard);
    const selectedCardIndex = cardsArray.indexOf(selectedCard);
    cardsArray.splice(selectedCardIndex, 1);

    // Draw card for meadow if necessary
    if (gameState.meadow.length === 7) {
        let newCard = drawRandomCards(1);
        newCard.forEach(card => gameState.meadow.push(card))
    }

    // Rendering
    renderPlayerHandWithListeners();
    renderMeadowWithListeners();
    renderCards(gameState.player.city, document.querySelector('#player-city .cards-grid'));
};

const showComputer = () => {
    const showCpuButton = document.getElementById('show-computer');
    const showCpuArea = document.getElementById('computer-area');

    showCpuButton.addEventListener('click', () => {
        const isHidden = showCpuArea.classList.toggle('hidden'); // [NEW] .classList.toggle()
        showCpuButton.innerText = isHidden ? 'Show Computer\'s City' : 'Hide Computer\'s City';
        showCpuButton.setAttribute('aria-expanded', !isHidden);
        showCpuArea.setAttribute('aria-hidden', isHidden);
    })
}

gameInit().then(() => {
    renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
    workersWithListeners();
    renderPlayerHandWithListeners();
    renderMeadowWithListeners();
    renderCards(gameState.computer.city, document.querySelector('#computer-area .cards-grid'));
    showComputer();
})

// For testing
window.gameState = gameState;
window.placeWorker = placeWorker;
window.modifyResources = modifyResources;