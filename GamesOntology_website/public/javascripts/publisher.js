let allPublishers = []; // Variabile globale per salvare i dati

// Funzione principale per recuperare i dati dei publisher dall'endpoint
async function fetchPublishers() {
    try {
        const response = await fetch('/publisher');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data.length > 0) {
            allPublishers = data.data; // Salva i dati globalmente
            populatePublisherCards(data.data);
        } else {
            renderNoPublishersMessage();
        }
    } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        renderErrorMessage(error.message);
    }
}

// Funzione per popolare le card dei publisher
function populatePublisherCards(publishers) {
    const container = document.getElementById('publisher-container');
    container.innerHTML = ''; // Svuota il contenitore

    // Raggruppa i publisher per nome
    const groupedPublishers = groupBy(publishers, 'publisherName');

    Object.entries(groupedPublishers).forEach(([publisherName, games]) => {
        const publisherCard = createPublisherCard(publisherName, games);
        container.appendChild(publisherCard); // Aggiungi la card al contenitore
    });
}

// Funzione per creare una singola card del publisher
function createPublisherCard(publisherName, games) {
    const card = document.createElement('div');
    card.classList.add('devPublisher-card');

    // Immagine del publisher
    const image = document.createElement('img');
    image.classList.add('devPublisher-image');
    image.alt = `${publisherName} Logo`;
    image.src = findValidImagePath(publisherName); // Imposta direttamente il percorso immagine

    // Titolo del publisher
    const title = document.createElement('h3');
    title.classList.add('devPublisher-title');
    title.textContent = publisherName;

    // Descrizione del publisher
    const description = document.createElement('p');
    description.classList.add('devPublisher-description');
    description.textContent = 'Scopri i giochi sviluppati da questo publisher!';

    // Bottone "Dettagli"
    const detailsButton = document.createElement('button');
    detailsButton.classList.add('details-button');
    detailsButton.textContent = 'Dettagli';
    detailsButton.onclick = () => showDetails(publisherName);

    // Composizione della card
    card.appendChild(image);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(detailsButton);

    return card;
}

// Funzione per trovare il percorso immagine valido
function findValidImagePath(publisherName) {
    const formattedName = publisherName.replace(/\s+/g, ''); // Rimuove spazi

    const imageExtensions = {
        'BlizzardEntertainment': 'avif',
        'EASports': 'webp',
        'GuerrillaGames': 'jpg',
        'Konami': 'png',
        'MojangStudios': 'jpg',
        'PsyonixStudios': 'jpg',
        'RockstarGames': 'png',
        'Sony': 'jpg',
        'SquareEnix': 'png',
    };

    const extension = imageExtensions[formattedName];
    if (extension) {
        return `/images/IMG_Publisher/${formattedName}.${extension}`;
    } else {
        return 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';
    }
}

// Funzione per mostrare i dettagli del publisher
function showDetails(publisherName) {
    // Trova i giochi del publisher
    const groupedPublishers = groupBy(allPublishers, 'publisherName');
    const games = groupedPublishers[publisherName] || [];

    // Popola la modale
    const modalTitle = document.getElementById('modal-title');
    const modalGameList = document.getElementById('modal-game-list');

    modalTitle.textContent = `Giochi sviluppati da ${publisherName}`;
    modalGameList.innerHTML = ''; // Pulisce la lista precedente

    games.forEach((game) => {
        const listItem = document.createElement('li');
        listItem.textContent = game.gameName;
        modalGameList.appendChild(listItem);
    });

    // Mostra la modale
    const modal = document.getElementById('details-modal');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

// Funzione per chiudere la modale
function closeModal() {
    const modal = document.getElementById('details-modal');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Funzione per mostrare un messaggio di errore
function renderErrorMessage(message) {
    const container = document.getElementById('publisher-container');
    container.innerHTML = `<p>Errore nel caricamento dei dati: ${message}</p>`;
}

// Funzione per mostrare un messaggio quando non ci sono publisher
function renderNoPublishersMessage() {
    const container = document.getElementById('publisher-container');
    container.innerHTML = '<p>Nessun publisher trovato.</p>';
}

// Funzione per raggruppare i publisher per nome
function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
        return result;
    }, {});
}

// Event listener per chiudere la modale
document.getElementById('close-modal').addEventListener('click', closeModal);

// Nascondi la modale se clicchi fuori dal contenuto
document.getElementById('details-modal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
        closeModal();
    }
});

// Recupera i dati quando la pagina è caricata
document.addEventListener('DOMContentLoaded', fetchPublishers);
