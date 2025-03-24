import { gameState } from "./game-state.js";
import { drawFromDeck, getDeckLength, getLocationLength } from "./everdell-idb.js";

// Add cards to area
const addCardToArea = (card, area) => {
    area.push(card);
}

async function replenishMeadow() {
    let meadowLength = await getLocationLength('meadow');
    if (meadowLength < 8) {
        await drawFromDeck('main-deck', 'cards', 1, 'meadow');
    }
};

export { addCardToArea, replenishMeadow };