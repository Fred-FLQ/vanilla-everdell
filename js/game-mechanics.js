import { gameState } from "./game-state.js";
import { addCardToArea, replenishMeadow } from "./cards-handling.js";
import { renderCounter, renderAllCards } from "./dom-helper.js";
import { queryDB, drawFromMainDeck, getLocationLength, getAllCards, changeCardLocation } from "./everdell-idb.js";

function addPoints(amount) {
    gameState.player.points += amount;
    renderCounter(gameState.player.points, document.querySelector('#player-points span'));
};

function hasEnoughResources(card) {
    return Object.keys(card.cost).every(resource => gameState.player.resources[resource] >= card.cost[resource]);
};

function modifyResources(resource, amount) { // Quantity can be negative
    gameState.player.resources[resource] += amount;
    renderCounter(gameState.player.resources[resource], document.querySelector(`#${resource} span`));
};

// [TO DO] The 'location' term needs to be changed to something else <=> conflict with IDB stores index
async function getResources(location) {
    let p1HandLength;
    let newCards; // Need to declare it before hand because a switch statement does not create separate scopes for each case. 
    switch (location) {
        case 'threeTwig':
            modifyResources('twig', 3);
            break;
        case 'twoTwigOneCard':
            modifyResources('twig', 2);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            await renderAllCards();
            break;
        case 'twoResin':
            modifyResources('resin', 2);
            break;
        case 'oneResinOneCard':
            modifyResources('resin', 1);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            await renderAllCards();
            break;
        case 'twoCardOnePoint':
            p1HandLength = await getLocationLength('p1-hand');
            if (p1HandLength === 7) {
                await drawFromMainDeck(1, 'p1-hand');
                alert('You can only draw 1 card.');
            } else if (p1HandLength < 7) {
                await drawFromMainDeck(2, 'p1-hand');
            } else {
                alert('Maximum of 8 cards in hand.');
            }
            await renderAllCards();
            addPoints(1);
            break;
        case 'onePebble':
            modifyResources('pebble', 1);
            break;
        case 'oneBerryOneCard':
            modifyResources('berry', 1);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            await renderAllCards();
            break;
        case 'oneBerry':
            modifyResources('berry', 1);
            break;
    }
};

// [TO DO] The 'location' term needs to be changed to something else <=> conflict with IDB stores index
// Players & computer actions
async function placeWorker(location) {
    if (gameState.player.workers > 0) {
        gameState.player.workers -= 1;
        gameState.basicActionSpaces[location] += 1;
        renderCounter(gameState.player.workers, document.querySelector('#player-workers span'));
        renderCounter(gameState.basicActionSpaces[location], document.querySelector(`#${location} span`));
        getResources(location);
    } else {
        alert("You don't have any more workers.");
    }
};

async function cpuPlaysCard() {
    let cpuRandomIndex = Math.floor(Math.random() * 8);
    let meadowCards = await getAllCards('meadow');
    let cpuNewCard = meadowCards[cpuRandomIndex];
    return queryDB('cards', 'readwrite', 'put', null, {...cpuNewCard, location: 'cpu-city'});
};

async function playCard(cardID, cardsArray) {
    // Check how many cards in Player's city
    let p1CityLength = await getLocationLength('p1-city');
    if (p1CityLength === 15) {
        alert('You have reached the maximum number of cards in your city.');
        return;
    }

    let p1City =  await getAllCards('p1-city');

    // Loop through cards array until match cardID = card.id
    const selectedCard = cardsArray.find(card => card.id === cardID); // If true, returns matching card

    // If selected card is unique, check if already in city
    if (selectedCard.unique && p1City.find(card => card.name === selectedCard.name)) {
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
    await changeCardLocation(selectedCard, 'p1-city');

    // Draw card for meadow if necessary
    await replenishMeadow();

    // Rugwort plays a card automatically after the player
    await cpuPlaysCard();
    await replenishMeadow();

    // Rendering
    await renderAllCards();
};

export { addPoints, modifyResources, placeWorker, playCard };