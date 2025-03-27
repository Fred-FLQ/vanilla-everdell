import { gameState } from "./game-state.js";
import { renderCounter, renderAllCards } from "./dom-helper.js";
import { queryDB, drawFromMainDeck, getLocationLength, getAllCards, changeCardLocation } from "./everdell-idb.js";

async function addPoints(player, amount) {
    let playerData = await queryDB('players', 'readonly', 'get', player);

    if (!playerData) throw new Error(`Player ${player} data not found.`);

    playerData.points += amount;
    await queryDB('players', 'readwrite', 'put', player, playerData);

     // [TO DO] Refactor needed for multiplayer
    renderCounter(playerData.points, document.querySelector('#player-points span'));
};

function hasEnoughResources(card) {
    return Object.keys(card.cost).every(resource => gameState.player.resources[resource] >= card.cost[resource]);
};

function modifyResources(resource, amount) { // Quantity can be negative
    gameState.player.resources[resource] += amount;
    renderCounter(gameState.player.resources[resource], document.querySelector(`#${resource} span`));
};

async function getResources(spot) {
    let p1HandLength;
    let needsRender = false;

    switch (spot) {
        case 'threeTwig':
            modifyResources('twig', 3);
            break;
        case 'twoTwigOneCard':
            modifyResources('twig', 2);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            needsRender = true;
            break;
        case 'twoResin':
            modifyResources('resin', 2);
            break;
        case 'oneResinOneCard':
            modifyResources('resin', 1);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            needsRender = true;
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
            needsRender = true;
            addPoints('p1', 1);  // [TO DO] Refactor needed for multiplayer
            break;
        case 'onePebble':
            modifyResources('pebble', 1);
            break;
        case 'oneBerryOneCard':
            modifyResources('berry', 1);
            p1HandLength = await getLocationLength('p1-hand');
            p1HandLength < 8 ? await drawFromMainDeck(1, 'p1-hand') : alert('Maximum of 8 cards in hand.');
            needsRender = true;
            break;
        case 'oneBerry':
            modifyResources('berry', 1);
            break;
    }

    if (needsRender) await renderAllCards();
};

// Players & computer actions
async function placeWorker(spot) {
    let playerData = await queryDB('players', 'readonly', 'get', 'p1'); // [TO DO] Refactor needed for multiplayer

    if (playerData.workers > 0) {
        playerData.workers -= 1;
        await queryDB('players', 'readwrite', 'put', 'p1', playerData); // [TO DO] Refactor needed for multiplayer
        
        let spotData = await queryDB('action-spaces', 'readonly', 'get', spot);
        spotData.workersQuantity++;
        await queryDB('action-spaces', 'readwrite', 'put', spot, spotData);
        
        renderCounter(playerData.workers, document.querySelector('#player-workers span'));
        renderCounter(spotData.workersQuantity, document.querySelector(`#${spot} span`));
        getResources(spot);
    } else {
        alert("You don't have any more workers.");
    }
};

async function cpuPlaysCard() {
    let cpuRandomIndex = Math.floor(Math.random() * 8);
    let meadowCards = await getAllCards('meadow');
    if (meadowCards.lenght === 0) {
        return console.error('No more cards for computer to play.')
    } else {
        let cpuNewCard = meadowCards[cpuRandomIndex];
        return queryDB('cards', 'readwrite', 'put', null, { ...cpuNewCard, location: 'cpu-city' });
    }
};

async function replenishMeadow() {
    let meadowLength = await getLocationLength('meadow');
    if (meadowLength < 8) {
        await drawFromMainDeck(1, 'meadow');
    }
};

async function playCard(cardID, cardsArray) {

    let p1City = await getAllCards('p1-city');
    if (p1City.length === 15) {
        alert('You have reached the maximum number of cards in your city.');
        return;
    }

    const selectedCard = cardsArray.find(card => card.id === cardID);

    if (selectedCard.unique && p1City.find(card => card.name === selectedCard.name)) {
        alert('You cannot have 2 unique identical cards.');
        return; // Exit if unique card already exists
    };

    if (!hasEnoughResources(selectedCard)) {
        alert('Not enough resources to play this card.');
        return;
    } else {
        Object.keys(selectedCard.cost).forEach(resource => {
            modifyResources(resource, -selectedCard.cost[resource]);
        });
    };

    await changeCardLocation(selectedCard, 'p1-city');
    await replenishMeadow();
    await cpuPlaysCard();
    await replenishMeadow();
    await renderAllCards();
};

export { modifyResources, placeWorker, playCard };