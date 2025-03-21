import { drawRandomCards, fetchCardsData } from './cards-handling.js';
import { gameState } from './game-state.js';
import { modifyResources, placeWorker, playCard } from './game-mechanics.js';
import { openDB, populateMainDeck, getCard, getAllCards, drawFromDeck, getDeckLength } from './everdell-idb.js';

async function gameInit() {
    await fetchCardsData();
    return openDB()
        .then(db => {
            return populateMainDeck(db).then(()=> db);
        })
        .then(db => {
            drawFromDeck('main-deck', 'cards', 8, 'meadow');
            return db;
        })
        .catch(error => {
            console.error('Failed to open DB:', error);
        });

    // Player gets 2 workers
    gameState.player.workers = 2;

    // Player draws 5 cards
    gameState.player.hand = drawRandomCards(5);

};

// Cards Rendering, updating and event listeners
// Render counters
async function renderCounter(counterState, containerElem) {
    containerElem.textContent = counterState;
};

// IDB READY
// Render cards in context
async function renderCards(cardsArray, containerElem) {
    containerElem.innerHTML = ''; // Clear container before loading cards
    const renderCardsElem = containerElem;
    cardsArray.forEach(card => {
        const cardContainer = renderCardsElem.appendChild(document.createElement("article"));
        cardContainer.classList.add("card");

        cardContainer.id = card.id;

        const cardCostHTML = Object.keys(card.cost)
            .map(ressource => {
                return `<li>${ressource}: ${card.cost[ressource]}&nbsp;</li>`;
            })
            .join('');
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
function workersWithListeners() {
    document.querySelectorAll('#locations li').forEach((location) => {
        location.onclick = () => placeWorker(location.id);
    })
};

function renderPlayerHandWithListeners() {
    renderCards(gameState.player.hand, document.querySelector('#player-hand .cards-grid'));
    document.querySelectorAll('#player-hand .card').forEach(card => {
        card.onclick = () => playCard(card.id, gameState.player.hand);
    });
};

async function renderMeadowWithListeners(db) {
    let meadowArray = await getAllCards(db, 'meadow');
    renderCards(meadowArray, document.querySelector('#meadow .cards-grid'));
    document.querySelectorAll('#meadow .card').forEach(card => {
        card.onclick = () => playCard(card.id, meadowArray);
    })
};

function renderAllCards() {
    renderPlayerHandWithListeners();
    renderMeadowWithListeners();
    renderCards(gameState.player.city, document.querySelector('#player-city .cards-grid'));
    renderCards(gameState.computer.city, document.querySelector('#computer-area .cards-grid'));
};

function showComputer() {
    const showCpuButton = document.getElementById('show-computer');
    const showCpuArea = document.getElementById('computer-area');

    showCpuButton.addEventListener('click', () => {
        const isHidden = showCpuArea.classList.toggle('hidden'); // [NEW] .classList.toggle()
        showCpuButton.innerText = isHidden ? 'Show Computer\'s City' : 'Hide Computer\'s City';
        showCpuButton.setAttribute('aria-expanded', !isHidden);
        showCpuArea.setAttribute('aria-hidden', isHidden);
    })
};

gameInit().then(db => {
    renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
    workersWithListeners();
    renderPlayerHandWithListeners();
    renderMeadowWithListeners(db);
    renderCards(gameState.computer.city, document.querySelector('#computer-area .cards-grid'));
    showComputer();
});

export { renderAllCards, renderCounter };

// For testing
window.gameState = gameState;
window.modifyResources = modifyResources;
window.getCard = getCard;
window.drawFromDeck = drawFromDeck;
window.getDeckLength = getDeckLength;
window.getAllCards = getAllCards;
window.renderCards = renderCards;