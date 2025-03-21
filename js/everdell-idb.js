const DB_NAME = 'everdell_DB';
const DB_VERSION = 6;

let everdellDB;

function openDB() {
    console.log('Trying to open DB...');

    return new Promise((resolve, reject) => {
        const openRequest = window.indexedDB.open(DB_NAME, DB_VERSION);

        openRequest.onsuccess = (event) => {
            console.log('Database opened successfully');
            everdellDB = openRequest.result;
            resolve(everdellDB);
        };

        openRequest.onerror = (event) => {
            console.error('Database failed to open: ' + event.target.errorCode);
            reject(event.target.errorCode);
        };

        openRequest.onupgradeneeded = (event) => {
            everdellDB = event.target.result;

            for (const store of everdellDB.objectStoreNames) {
                everdellDB.deleteObjectStore(store);
            }

            const mainDeckStore = everdellDB.createObjectStore('main-deck', { keyPath: 'id' });
            mainDeckStore.createIndex('id', 'id', { unique: true });
            const meadowStore = everdellDB.createObjectStore('meadow', { keyPath: 'id' });
            meadowStore.createIndex('id', 'id', { unique: true });
            const handsStore = everdellDB.createObjectStore('hands', { keyPath: 'id' });
            handsStore.createIndex('id', 'id', { unique: true });
            handsStore.createIndex('owner', 'owner', { unique: false });

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

async function populateMainDeck(db) {
    try {
        const response = await fetch('./data/cards.json');

        if (!response.ok) {
            throw new Error('Fetching from json failed.');
        }

        const cardsJson = await response.json();

        for (const store of db.objectStoreNames) {
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

async function getCard(cardId) {
    return await queryDB('main-deck', 'readonly', 'get', cardId);
};

function getAllCards(db, deck) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(deck, 'readonly');
        const objectStore = transaction.objectStore(deck);
        const cursorQuery = objectStore.openCursor();
        let cardsArray = [];

        cursorQuery.onsuccess = async () => {
            let cursor = cursorQuery.result;
            if (cursor) {
                let card = cursor.value;
                cardsArray.push(card);
                cursor.continue();
            } else {
                resolve(cardsArray);
            }
        };
    })
};

async function getDeckLength(deck) {
    return await queryDB(deck, 'readonly', 'count');
};

async function drawFromDeck(originDeck, destinationDeck, cardsQuantity) {
    const transaction = everdellDB.transaction([originDeck, destinationDeck], 'readwrite');
    const originStore = transaction.objectStore(originDeck);
    const destinationStore = transaction.objectStore(destinationDeck);
    const cursorQuery = originStore.openCursor();
    let cardsToDraw = cardsQuantity;

    cursorQuery.onsuccess = () => {
        let cursor = cursorQuery.result;
        if (cursor && cardsToDraw > 0) {
            let card = cursor.value;

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

export { openDB, populateMainDeck, getCard, getAllCards, drawFromDeck, getDeckLength };