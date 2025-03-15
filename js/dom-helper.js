import { drawRandomCards, fetchCardsData } from './cards-handling.js';
import { gameState } from './game-state.js';
import { modifyResources, placeWorker, playCard } from './game-mechanics.js';
import { openDB, populateMainDeck, getCard, drawFromDeck, getMainDeckLength } from './everdell-idb.js';

const gameInit = async () => {
    await fetchCardsData();
    openDB().then(db => {
        console.log('DB is ready, now populating...');
        populateMainDeck(db);
    }).catch(error => {
        console.error('Failed to open DB:', error);
    });
    // Place 8 random cards in meadow
    gameState.meadow = drawRandomCards(8);

    // Player gets 2 workers
    gameState.player.workers = 2;

    // Player draws 5 cards
    gameState.player.hand = drawRandomCards(5);

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

const renderAllCards = () => {
    renderPlayerHandWithListeners();
    renderMeadowWithListeners();
    renderCards(gameState.player.city, document.querySelector('#player-city .cards-grid'));
    renderCards(gameState.computer.city, document.querySelector('#computer-area .cards-grid'));
}

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

export { renderAllCards, renderCounter };

// For testing
window.gameState = gameState;
window.modifyResources = modifyResources;
window.getCard = getCard;
window.drawFromDeck = drawFromDeck;
window.getMainDeckLength = getMainDeckLength;