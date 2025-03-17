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
}

function deleteCard(id) {
    const transaction = everdellDB.transaction('main-deck', 'readwrite');
    const objectStore = transaction.objectStore('main-deck');
    const request = objectStore.delete(id);
}

async function getDeckLength(store) {
    return await queryDB(store, 'readonly', 'count');
}

// Need to .delete() drawn card and push it to other store
async function drawFromDeck(originDeck, destinationDeck) {
    let cursor = await queryDB(originDeck, 'readonly', 'openCursor');
    if (cursor) {
        let card = cursor.value;
        console.log(card);
        await queryDB(destinationDeck, 'readwrite', 'add', null, card);
    } else {
        console.log('No more cards in deck.');
    }
    // return new Promise((resolve, reject) => {
    //     const transaction = everdellDB.transaction('main-deck', 'readonly');
    //     const objectStore = transaction.objectStore('main-deck');
    //     const request = objectStore.openCursor();

    //     request.onerror = () => reject('Failed to draw card.');
    //     request.onsuccess = () => {
    //         let cursor = request.result;
    //         if (cursor) {
    //             let card = cursor.value;
    //             console.log(card);
    //             resolve(card);
    //         } else {
    //             console.log("No more cards in deck.");
    //         }
    //     };
    // });
}


export { openDB, populateMainDeck, getCard, drawFromDeck, getDeckLength };