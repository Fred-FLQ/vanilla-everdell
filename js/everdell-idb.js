const DB_NAME = 'everdell_DB';
const DB_VERSION = 4;

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
    const transaction = db.transaction(['main-deck'], 'readwrite');
    const objectStore = transaction.objectStore('main-deck');

    const fetchCardsData = async () => {
        await fetch('./data/cards.json')
            .then(response => {
                if (!response.ok) {         // Reversed the logic for readability: making error the exception
                    throw new Error('Network response failed.');
                }
                return response.json();
            })
            .then(cardsJson => {
                for (let card of cardsJson) {
                    objectStore.add({
                        name: card,
                        ...cardsJson[card]
                    });
                }
            })
            .catch(error => console.error("Error fetching cards data:", error));
    };
};

export { openDB, populateDB };