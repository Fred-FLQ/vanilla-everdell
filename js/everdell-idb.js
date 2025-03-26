const DB_NAME = 'everdell_DB';
const DB_VERSION = 9;

let everdellDB;

function openDB() {
    console.log('Trying to open DB...');

    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(DB_NAME, DB_VERSION);

        openRequest.onsuccess = () => {
            console.log('Database opened successfully');
            everdellDB = openRequest.result;
            resolve(everdellDB);
        };

        openRequest.onerror = () => {
            console.error('Database failed to open: ' + openRequest.error);
            reject(openRequest.error);
        };

        openRequest.onupgradeneeded = () => {
            everdellDB = openRequest.result;

            for (const store of everdellDB.objectStoreNames) {
                everdellDB.deleteObjectStore(store);
            }

            const mainDeckStore = everdellDB.createObjectStore('main-deck', { keyPath: 'id' });
            mainDeckStore.createIndex('id', 'id', { unique: true });

            const cardsStore = everdellDB.createObjectStore('cards', { keyPath: 'id' });
            cardsStore.createIndex('id', 'id', { unique: true });
            cardsStore.createIndex('location', 'location', { unique: false });

            const playersStore = everdellDB.createObjectStore('players', { keyPath: 'owner' });
            playersStore.createIndex('owner', 'owner', { unique: true });

            const actionSpacesStore = everdellDB.createObjectStore('action-spaces', { keyPath: 'spaceId' });
            actionSpacesStore.createIndex('spaceId', 'spaceId', { unique: true });

            console.log('Database structure created/updated.');

            everdellDB.onversionchange = () => everdellDB.close();
        };
    });

};

function queryDB(storeName, mode, action, key = null, data = null) {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction(storeName, mode);
        const objectStore = transaction.objectStore(storeName);
        let query;

        switch (action) {
            case 'add':
                query = objectStore.add(data);
                break;
            case 'clear':
                query = objectStore.clear();
                break;
            case 'count':
                query = objectStore.count();
                break;
            case 'get':
                query = objectStore.get(key);
                break;
            case 'openCursor':
                query = objectStore.openCursor();
                break;
            case 'put':
                query = objectStore.put(data);
                break;
            default:
                reject('Invalid action:' + action);
                return;
        }

        query.onerror = () => reject('Failed to query database.');
        query.onsuccess = () => {
            if (query.result === undefined && action === 'get') {
                reject(new Error(`No result found for key: ${key}`));
            } else {
                resolve(query.result);
            }
        };
    });
};

async function populateMainDeck() {
    try {
        const response = await fetch('./data/cards.json');

        if (!response.ok) throw new Error('Fetching cards from json failed.');

        const cardsJson = await response.json();

        // [TO DO] New stores added - need to refactor that later
        for (const store of everdellDB.objectStoreNames) {
            await queryDB(store, 'readwrite', 'clear');
            console.log(`Cleared ${store} from old data.`)
        }

        const putPromises = [];
        for (const [name, cardData] of Object.entries(cardsJson)) {
            for (let i = 0; i < cardData.count; i++) {
                putPromises.push(
                    queryDB('main-deck', 'readwrite', 'add', null, {
                        id: crypto.randomUUID(),
                        name,
                        location: 'main-deck',
                        ...cardData
                    })
                );
            }
        }

        await Promise.allSettled(putPromises);
        console.log('Store populated successfully.');

    } catch (error) {
        console.error('Error when populating main deck:', error);
    };
};

async function populateActionSpaces() {
    try {
        const response = await fetch('./data/action-spaces.json');

        if (!response.ok) throw new Error('Fetching action spaces from json failed.');

        const actionSpacesJson = await response.json();
        
        const putPromises = [];
        for (const actionSpace of actionSpacesJson) {
            putPromises.push(
                queryDB('action-spaces', 'readwrite', 'put', null, {
                    workersQuantity: 0,
                    ...actionSpace
                })
            );
        }

        await Promise.allSettled(putPromises);
    } catch(error) {
        console.error('Error when populating action spaces data', error);
    };
};

async function populatePlayers() {
    let players = ['cpu', 'p1', 'p2', 'p3', 'p4'];

    const putPromises = [];
    for (const player of players) {
        putPromises.push(
            queryDB('players', 'readwrite', 'put', null, {
                owner: player,
                workers: 2,
                resources: {
                    twig: 0,
                    resin: 0,
                    pebble: 0,
                    berry: 0
                },
                points: 0
            })
        );
    }

    await Promise.allSettled(putPromises);
};

function getAllCards(location) {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction('cards', 'readonly');
        const objectStore = transaction.objectStore('cards');
        const locationIndex = objectStore.index('location');

        let request = locationIndex.getAll(location);

        request.onsuccess = async () => {
            if (request.result !== undefined) {
                resolve(request.result);
            } else {
                console.log(`No cards found for location ${location}.`);
            }
        };

        request.onerror = () => {
            console.error(`Error retrieving cards for location: ${location}`);
            reject(request.error);
        };
    })
};

// FOR TESTING ONLY - TO BE DEPRECATED
function getDeckLength(deck) {
    return queryDB(deck, 'readonly', 'count');
};

// NOTE: might not be useful, can just getAllCards() and use resulting array.length
function getLocationLength(location) {
    return new Promise((resolve, reject) => {
        const index = everdellDB.transaction('cards', 'readonly').objectStore('cards').index('location');

        let request = index.count(location);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
};

function drawFromMainDeck(cardsQuantity, location) {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction(['main-deck', 'cards'], 'readwrite');
        const originStore = transaction.objectStore('main-deck');
        const destinationStore = transaction.objectStore('cards');
        const cursorQuery = originStore.openCursor();
        let cardsToDraw = cardsQuantity;

        cursorQuery.onsuccess = () => {
            let cursor = cursorQuery.result;
            if (cursor && cardsToDraw > 0) {
                let card = cursor.value;
                card.location = location;
                let addRequest = destinationStore.add(card);
                addRequest.onsuccess = () => {
                    cursor.delete();
                    cardsToDraw--;
                    cursor.continue();
                };
            } else {
                console.log(`${cardsQuantity} cards successfully drawn.`);
                resolve();
            }
        };

        cursorQuery.onerror = () => {
            console.error('Unable to draw from the main deck.');
            reject(new Error('Unable to draw from the main deck.'));
        };
    });
};

function changeCardLocation(card, newLocation) {
    return queryDB('cards', 'readwrite', 'put', null, { ...card, location: newLocation });
};

export { openDB, queryDB, populateMainDeck, populateActionSpaces, populatePlayers, getAllCards, drawFromMainDeck, getDeckLength, getLocationLength, changeCardLocation };