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

async function populateDB(db) {
    try {
        const response = await fetch('./data/cards.json');

        if (!response.ok) {
            throw new Error('Fetching from json failed.');
        }

        const cardsJson = await response.json();

        const transaction = db.transaction(['main-deck'], 'readwrite');
        const objectStore = transaction.objectStore('main-deck');

        objectStore.clear().onsuccess = () => {
            console.log("Cleared main-deck store. Populating with fresh data...");

            for (let card in cardsJson) {
                objectStore.put({
                    id: crypto.randomUUID(),
                    name: card,
                    ...cardsJson[card]
                });
            }
        }

        transaction.oncomplete = () => console.log("Store populated successfully.");
        transaction.onerror = (event) => console.error("Transaction error:", event.target.error);

    } catch (error) {
        console.error("Error fetching cards data:", error);
    };
};

function getCard(cardName) {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction('main-deck', 'readonly');
        const objectStore = transaction.objectStore('main-deck');
        const request = objectStore.get(cardName);

        request.onerror = (event) => reject('Failed to retrieve card.');
        request.onsuccess = (event) => resolve(event.target.result);
    });

}

function getMainDeckLength() {
    return new Promise((resolve, reject) => {
        const transaction = everdellDB.transaction('main-deck', 'readonly');
        const objectStore = transaction.objectStore('main-deck');
        const request = objectStore.count();

        request.onerror = event => reject('Failed to evaluate main deck length.');
        request.onsuccess = event => resolve(event.target.result);
    });
}

// Need to refactor this one to drawFromDeck(number of cards to draw)
// => ust use openCursor() and draw in order - return value
// function getRandomEntry(num) {
//     return new Promise((resolve, reject) => {
//         const transaction = everdellDB.transaction('main-deck', 'readonly');
//         const objectStore = transaction.objectStore('main-deck');
//         const request = objectStore.openCursor();

//         request.onerror = () => reject('Failed to get random entry.');
//         request.onsuccess = () => {
//             let cursor = request.result;
//             if (cursor) {
//                 let key = cursor.key;
//                 let value = cursor.value;
//                 // console.log(key, value);
//                 cursor.advance(num);
//                 return cursor.value;
//               } else {
//                 console.log("No more cards");
//               }
//         };
//     });
// }

export { openDB, populateDB, getCard, getMainDeckLength };