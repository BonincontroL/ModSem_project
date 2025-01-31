document.addEventListener('DOMContentLoaded', async () => {
    /**
     * Recupera i parametri dalla URL e ottiene l'ID del gioco.
     */
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    // Controlla se l'ID del gioco è presente, altrimenti mostra un messaggio di errore
    if (!gameId) {
        displayErrorMessage('Game not found');
        return;
    }

    try {
        // Effettua la richiesta per i dettagli del gioco
        const response = await fetch(`/games/details?id=${encodeURIComponent(gameId)}`);

        // Controlla se la risposta è valida
        if (!response.ok) {
            throw new Error('Failed to fetch game details');
        }

        const data = await response.json();

        // Controlla se i dati ricevuti hanno successo
        if (data.success) {
            renderGameDetails(data.data, gameId);
        } else {
            displayErrorMessage(data.message || 'No game details available');
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dettagli del gioco:', error);
        displayErrorMessage('Error loading game details');
    }
});

/**
 * Visualizza un messaggio di errore nella pagina.
 * @param {string} message - Messaggio di errore da mostrare.
 */
function displayErrorMessage(message) {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <h1>${message}</h1>
        </div>
    `;
}

/**
 * Normalizza il nome di un gioco per confronti più accurati.
 * @param {string} name - Nome del gioco da normalizzare.
 * @returns {string} Nome normalizzato.
 */
function normalizeGameName(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
}

/**
 * Mostra i dettagli del gioco sulla pagina.
 * @param {Object} game - Oggetto contenente i dettagli del gioco.
 * @param {string} gameId - ID del gioco (necessario per ottenere l'anno di rilascio).
 */
function renderGameDetails(game, gameId) {
    // Recupera gli elementi DOM
    const gameNameElement = document.getElementById('gameName');
    const gameCommentElement = document.getElementById('gameComment');
    const gameGenreElement = document.getElementById('gameGenre');
    const gameCharactersElement = document.getElementById('gameCharacters');
    const multiplayerModeElement = document.getElementById('multiplayerMode');
    const releaseYearElement = document.getElementById('releaseYear');
    const platformsElement = document.getElementById('platforms'); // Elemento per le piattaforme

    // Popola gli elementi con i dati del gioco
    gameNameElement.textContent = game.name || 'N/A';
    gameCommentElement.textContent = game.comment || 'N/A';
    gameGenreElement.textContent = Array.isArray(game.genre) ? game.genre.join(', ') : 'N/A';
    gameCharactersElement.textContent = Array.isArray(game.characters) ? game.characters.join(', ') : 'N/A';
    multiplayerModeElement.textContent = game.multiplayerMode ? 'Yes' : 'No';

    // Richiedi l'anno di rilascio da Wikidata
    fetchReleaseYear(game.name).then(releaseYear => {
        releaseYearElement.textContent = releaseYear || 'N/A';
    }).catch(() => {
        releaseYearElement.textContent = 'N/A';
    });

    // Richiedi le piattaforme da Wikidata
    fetchPlatforms(game.name).then(platforms => {
        platformsElement.innerHTML = `<strong>Platforms:</strong> ${platforms.length > 0 ? platforms.join(', ') : 'N/A'}`;
    }).catch(() => {
        platformsElement.innerHTML = `<strong>Platforms:</strong> N/A`;
    });
}

/**
 * Recupera l'anno di rilascio da Wikidata.
 * @param {string} gameName - Nome del gioco.
 * @returns {Promise<string>} L'anno di rilascio.
 */
async function fetchReleaseYear(gameName) {
    try {
        const response = await fetch('/games/releaseYears');
        const data = await response.json();

        if (data.success) {
            const normalizedGameName = normalizeGameName(gameName);
            const gameData = data.data.find(game => normalizeGameName(game.game) === normalizedGameName);
            return gameData ? gameData.releaseYear : null;
        } else {
            console.error('Errore nel recupero dell anno di rilascio:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Errore nella richiesta per l anno di rilascio:', error.message);
        return null;
    }
}

/**
 * Recupera le piattaforme di rilascio da Wikidata.
 * @param {string} gameName - Nome del gioco.
 * @returns {Promise<string[]>} Un array di piattaforme.
 */
async function fetchPlatforms(gameName) {
    try {
        const response = await fetch('/games/platforms');
        const data = await response.json();

        if (data.success) {
            const normalizedGameName = normalizeGameName(gameName);
            const platforms = data.data
                .filter(game => normalizeGameName(game.game) === normalizedGameName)
                .map(game => game.platform);
            return platforms;
        } else {
            console.error('Errore nel recupero delle piattaforme:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Errore nella richiesta per le piattaforme:', error.message);
        return [];
    }
}
