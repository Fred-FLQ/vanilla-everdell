import { drawRandomCards } from './cards-handling.js';
import { gameState } from './game-state.js';
import { modifyResources, placeWorker, playCard } from './game-mechanics.js';
import { openDB, populateMainDeck, getCard, getAllCards, drawFromDeck, getDeckLength, getLocationLength } from './everdell-idb.js';

async function gameInit() {
    gameState.player.workers = 2;
    await openDB();
    await populateMainDeck();
    drawFromDeck('main-deck', 'cards', 8, 'meadow');
    drawFromDeck('main-deck', 'cards', 5, 'p1-hand');
    drawFromDeck('main-deck', 'cards', 6, 'p1-city');
};

// Cards Rendering, updating and event listeners
// Render counters
// [CHECK] THIS ONE: why async?
async function renderCounter(counterState, containerElem) {
    containerElem.textContent = counterState;
};

// [STATUS] IDB READY
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

// [STATUS] IDB READY
async function renderPlayerHandWithListeners() {
    let p1Array = await getAllCards('p1-hand');
    renderCards(p1Array, document.querySelector('#player-hand .cards-grid'));
    document.querySelectorAll('#player-hand .card').forEach(card => {
        card.onclick = () => playCard(card.id, p1Array);
    });
};

// [STATUS] IDB READY
async function renderMeadowWithListeners() {
    let meadowArray = await getAllCards('meadow');
    renderCards(meadowArray, document.querySelector('#meadow .cards-grid'));
    document.querySelectorAll('#meadow .card').forEach(card => {
        card.onclick = () => playCard(card.id, meadowArray);
    })
};

// [STATUS] IDB READY
async function renderPlayerCity() {
    // let playerCity = await getAllCards(db, player +'-city'); // Version for multi player - to be improved
    let playerCity = await getAllCards('p1-city');
    renderCards(playerCity, document.querySelector('#player-city .cards-grid'));
}

// [STATUS] IDB READY
async function renderCpuCity() {
    let cpuCity = await getAllCards('cpu-city');
    renderCards(cpuCity, document.querySelector('#computer-area .cards-grid'));
}

// [STATUS] IDB READY
function renderAllCards() {
    renderPlayerHandWithListeners();
    renderMeadowWithListeners();
    renderPlayerCity();
    renderCpuCity();
};

// [STATUS] IDB READY
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

gameInit()
    .then(() => {
        renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
        workersWithListeners();
        renderPlayerHandWithListeners();
        renderMeadowWithListeners();
        renderCpuCity();
        showComputer();
    });

export { renderAllCards, renderCounter };

// For testing
window.gameState = gameState;
window.modifyResources = modifyResources;
window.getCard = getCard;
window.drawFromDeck = drawFromDeck;
window.getDeckLength = getDeckLength;
window.getLocationLength = getLocationLength;