const DB_NAME = 'everdell_DB';
const DB_VERSION = 5;

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

            if (everdellDB.objectStoreNames.contains('main-deck')) { // Need to delete my older data
                everdellDB.deleteObjectStore('main-deck');
            }

            const objectStore = everdellDB.createObjectStore('main-deck', { keyPath: 'id' });
            objectStore.createIndex('id', 'id', { unique: true });
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
            case 'get':
                query = objectStore.get(key);
                break;
            case 'clear':
                query = objectStore.clear();
                break;
            case 'put':
                query = objectStore.put(data);
                break;
            default:
                reject('Invalid action:' + action);
                return;
        }

        query.onerror = (event) => reject('Failed to query database.');
        query.onsuccess = (event) => resolve(event.target.result);
    });
};

async function populateMainDeck(db) {
    try {
        const response = await fetch('./data/cards.json');

        if (!response.ok) {
            throw new Error('Fetching from json failed.');
        }

        const cardsJson = await response.json();

        // const transaction = db.transaction(['main-deck'], 'readwrite');
        // const objectStore = transaction.objectStore('main-deck');
        // const request = objectStore.clear();

        await queryDB('main-deck', 'readwrite', 'clear');
        console.log("Cleared main-deck store. Populating with fresh data...");

        const putPromises = [];
        for (const [name, cardData] of Object.entries(cardsJson)) {
            for (let i = 0; i < cardData.count; i++) {
                putPromises.push(
                    queryDB('main-deck', 'readwrite', 'put', null, {
                        id: crypto.randomUUID(),
                        name,
                        ...cardData
                    })
                );
            }
        }

        await Promise.allSettled(putPromises);
        console.log('Store populated successfully.');

        // request.onerror = (event) => console.log('Error clearing store: ', event.target.error);
        // transaction.onerror = (event) => console.error('Transaction error:', event.target.error);

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

// DEPRECATED FOR NOW - Empty deck handled by openCursor()
function getMainDeckLength() {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction('main-deck', 'readonly');
        const objectStore = transaction.objectStore('main-deck');
        const request = objectStore.count();

        request.onerror = event => reject('Failed to evaluate main deck length.');
        request.onsuccess = event => resolve(event.target.result);
    });
}

// Need to .delete() drawn card and push it to other store
function drawFromDeck() {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction('main-deck', 'readonly');
        const objectStore = transaction.objectStore('main-deck');
        const request = objectStore.openCursor();

        request.onerror = () => reject('Failed to draw card.');
        request.onsuccess = () => {
            let cursor = request.result;
            if (cursor) {
                let card = cursor.value;
                console.log(card);
                resolve(card);
            } else {
                console.log("No more cards in deck.");
            }
        };
    });
}


export { openDB, populateMainDeck, getCard, drawFromDeck, getMainDeckLength };