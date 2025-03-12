import { gameState } from "./game-state.js";
import { drawRandomCards, addCardToArea, replenishMeadow } from "./cards-handling.js";
import { renderCounter, renderAllCards } from "./dom-helper.js";

// Increase victory points
const addPoints = (amount) => {
    gameState.player.points += amount;
    renderCounter(gameState.player.points, document.querySelector('#player-points span'));
}

// Check resources
const hasEnoughResources = (card) => {
    return Object.keys(card.cost).every(resource => gameState.player.resources[resource] >= card.cost[resource]);
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
            renderAllCards();
            break;
        case 'twoResin':
            modifyResources('resin', 2);
            break;
        case 'oneResinOneCard':
            modifyResources('resin', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderAllCards();
            break;
        case 'twoCardOnePoint':
            newCards = drawRandomCards(2);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderAllCards();
            addPoints(1);
            break;
        case 'onePebble':
            modifyResources('pebble', 1);
            break;
        case 'oneBerryOneCard':
            modifyResources('berry', 1);
            newCards = drawRandomCards(1);
            newCards.forEach(card => gameState.player.hand.length < 8 ? gameState.player.hand.push(card) : alert('Maximum of 8 cards in hand.'));
            renderAllCards();
            break;
        case 'oneBerry':
            modifyResources('berry', 1);
            break;
    }
}

// Players & computer actions
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

const cpuPlaysCard = () => {
    let rugwortCardIndex = Math.floor(Math.random() * 8);
    let rugwortNewCard = gameState.meadow.splice(rugwortCardIndex, 1);
    rugwortNewCard.forEach(card => addCardToArea(card, gameState.computer.city));
    replenishMeadow();
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
    if (!hasEnoughResources(selectedCard)) {
        alert('Not enough resources to play this card.');
        return;
    } else {
        Object.keys(selectedCard.cost).forEach(resource => {
            modifyResources(resource, -selectedCard.cost[resource]);
        });
    };

    // Add played card to city and remove it from hand/meadow
    addCardToArea(selectedCard, gameState.player.city);
    const selectedCardIndex = cardsArray.indexOf(selectedCard);
    cardsArray.splice(selectedCardIndex, 1);

    // Draw card for meadow if necessary
    replenishMeadow();

    // Rugwort plays a card automatically after the player
    cpuPlaysCard();

    // Rendering
    renderAllCards();
};

export { addPoints, modifyResources, placeWorker, playCard };