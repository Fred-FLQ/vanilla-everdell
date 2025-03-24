import { gameState } from "./game-state.js";
import { drawFromMainDeck, getDeckLength, getLocationLength } from "./everdell-idb.js";

// Add cards to area
const addCardToArea = (card, area) => {
    area.push(card);
}

async function replenishMeadow() {
    let meadowLength = await getLocationLength('meadow');
    if (meadowLength < 8) {
        await drawFromMainDeck(1, 'meadow');
    }
};

export { addCardToArea, replenishMeadow };