const DB_NAME = 'everdell_DB';
const DB_VERSION = 7;

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

            console.log('Database structure created/updated.');
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
        query.onsuccess = () => resolve(query.result);
    });
};

async function populateMainDeck() {
    try {
        const response = await fetch('./data/cards.json');

        if (!response.ok) {
            throw new Error('Fetching from json failed.');
        }

        const cardsJson = await response.json();

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
        console.error("Error when populating main deck:", error);
    };
};

// [STATUS] Need to be deprecated
async function getCard(cardId) {
    return await queryDB('main-deck', 'readonly', 'get', cardId);
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
    })
};

async function getDeckLength(deck) {
    return await queryDB(deck, 'readonly', 'count');
};

// NEED TO START BACK HERE AND CONNECT WITH replenishMeadow() in cards-handling
async function getLocationLength(location) {
    if (!everdellDB) {
        reject(new Error('Database not initialized.'));
        return;
    }
    return new Promise((resolve, reject) => {
        const index = everdellDB.transaction('cards', 'readonly').objectStore('cards').index('location');

        let request = index.count(location);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
};

async function drawFromDeck(originDeck, destinationDeck, cardsQuantity, location) {
    const transaction = everdellDB.transaction([originDeck, destinationDeck], 'readwrite');
    const originStore = transaction.objectStore(originDeck);
    const destinationStore = transaction.objectStore(destinationDeck);
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
            }
        } else {
            console.log(`${cardsQuantity} cards successfully drawn.`);
        }
    };

    cursorQuery.onerror = () => console.error(`Unable to draw from ${originDeck}.`);
};

export { openDB, populateMainDeck, getCard, getAllCards, drawFromDeck, getDeckLength, getLocationLength };