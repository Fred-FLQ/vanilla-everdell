const DB_NAME = 'everdell_DB';
const DB_VERSION = 2;

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
            const objectStore = everdellDB.createObjectStore('main-deck', { keyPath: 'name' });
            objectStore.createIndex('name', 'name', { unique: false });
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

        transaction.oncomplete = () => console.log("Transaction completed successfully.");
        transaction.onerror = (event) => console.error("Transaction error:", event.target.error);

        for (let card in cardsJson) {
            objectStore.put({
                name: card,
                ...cardsJson[card]
            });
        }
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

export { openDB, populateDB, getCard };