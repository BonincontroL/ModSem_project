document.addEventListener('DOMContentLoaded', async () => {
    const gamesContainer = document.getElementById('games-container');
    const searchBar = document.getElementById('search-bar');
    let allGames = []; // Memorizza tutti i giochi per il ripristino

    /**
     * Ottieni la lista completa dei giochi dal server.
     * @returns {Promise<Array>} Lista dei giochi.
     */
    async function fetchGames() {
        try {
            const response = await fetch('/games');
            const data = await response.json();
            if (response.ok) {
                return data.data;
            } else {
                console.error('Errore nel recupero dei dati:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error.message);
            return [];
        }
    }

    /**
     * Cerca giochi in base a una query.
     * @param {string} query - Query di ricerca.
     * @returns {Promise<Array>} Giochi filtrati.
     */
    async function searchGames(query) {
        try {
            const response = await fetch(`/games/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (response.ok) {
                return data.data;
            } else {
                console.error('Errore nella ricerca:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error.message);
            return [];
        }
    }

    /**
     * Crea una card HTML per un gioco.
     * @param {Object} game - Dati del gioco.
     * @returns {HTMLElement} Card del gioco.
     */
    function createGameCard(game) {
        const card = document.createElement('div');
        card.classList.add('game-card');
        console.log(card)

        // Percorso immagine basato sul tipo di gioco
        const folder = game.gameType === 'Characters' ? 'IMG_Characters' : 'IMG_Games';
        const imageName = `${game.gameName.replace(/\s+/g, '')}.jpg`;

        card.innerHTML = `
            <img src="/images/${folder}/${imageName}" 
                 alt="${game.gameName}" 
                 class="game-image" 
                 onerror="this.onerror=null; this.src='/images/default.jpg';" />
            <h3>${game.gameName}</h3>
            <button class="details-button" data-game-id="${encodeURIComponent(game.game)}">Dettagli</button>
        `;
        return card;
    }

    /**
     * Raggruppa i giochi per tipo.
     * @param {Array} games - Lista di giochi.
     * @returns {Object} Giochi raggruppati per tipo.
     */
    function groupGamesByType(games) {
        return games.reduce((acc, game) => {
            const type = game.gameType || 'Unknown';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(game);
            return acc;
        }, {});
    }


    /**
     * Popola la pagina con la lista dei giochi.
     * @param {Array} games - Giochi da visualizzare.
     */
    function populateGames(games) {
        gamesContainer.innerHTML = ''; // Svuota il contenitore

        if (games.length === 0) {
            gamesContainer.innerHTML = '<p>Nessun gioco trovato.</p>';
            return;
        }

        const gamesByType = groupGamesByType(games);

        for (const type in gamesByType) {
            const typeHeader = document.createElement('h2');
            typeHeader.classList.add('type-header'); // Aggiunge la classe per lo stile
            typeHeader.textContent = type;
            console.log("Formatted type:", typeHeader.textContent);

            const typeContainer = document.createElement('div');
            typeContainer.classList.add('type-container');

            gamesByType[type].forEach((game) => {
                const gameCard = createGameCard(game);
                typeContainer.appendChild(gameCard);
            });

            gamesContainer.appendChild(typeHeader);
            gamesContainer.appendChild(typeContainer);
        }

        // Aggiungi gli event listener ai pulsanti "Dettagli"
        document.querySelectorAll('.details-button').forEach((button) => {
            button.addEventListener('click', (event) => {
                const gameId = event.target.dataset.gameId; // Recupera l'ID del gioco
                if (gameId) {
                    // Reindirizza alla pagina del gioco
                    window.location.href = `/gamepage.html?id=${gameId}`;
                }
            });
        });
    }

    /**
     * Event listener per la barra di ricerca.
     */
    searchBar.addEventListener('input', async (event) => {
        const query = event.target.value.trim();
        if (query.length > 0) {
            const filteredGames = await searchGames(query); // Cerca i giochi che corrispondono alla query
            populateGames(filteredGames);
        } else {
            populateGames(allGames); // Ripristina tutti i giochi
        }
    });

    // Inizializza la pagina caricando tutti i giochi
    allGames = await fetchGames();
    populateGames(allGames);
});
