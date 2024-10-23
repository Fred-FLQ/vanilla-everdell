const cardsJson = require('../cards.json');

const gameState = {
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
    }
};

function drawRandomCards(cardsQuantity) {
    let randomCards = [];

    for (let i = 1; i <= cardsQuantity; i++) {
        let randomNumber = Math.floor(Math.random() * gameState.mainDeck.length);
        let randomCard = gameState.mainDeck[randomNumber];

        // Accessing count property of randomCard - [NEW] Easier to use the static method Object.values()
        for (let key in randomCard) {
            let cardData = randomCard[key];
            if (cardData.count === 1) {
                gameState.mainDeck.splice(randomNumber, 1);
            } else {
                cardData.count -= 1;
            }

            randomCards.push(randomCard);
        }
    }
    return randomCards;
}

function gameInit() {

    for (let card in cardsJson) {
        gameState.mainDeck.push({
            [card]: {                 // [NEW] - computed property name
                ...cardsJson[card]
            }
        }
        );
    };

    gameState.meadow = drawRandomCards(3);
};

//#######################################

gameInit();
console.log(gameState.mainDeck.length);
console.log(gameState.meadow);