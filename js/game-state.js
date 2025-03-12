// State Management
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

export { gameState };