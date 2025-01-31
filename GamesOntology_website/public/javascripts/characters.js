document.addEventListener('DOMContentLoaded', async () => {
    const charactersContainer = document.getElementById('characters-container');
    const searchBar = document.getElementById('search-bar');
    let allCharacters = {}; // Memorizza tutti i personaggi per sottoclasse

    /**
     * Recupera la lista di tutti i personaggi dal server.
     * @returns {Promise<Object>} Oggetto con i personaggi raggruppati per tipo.
     */
    async function fetchCharacters() {
        try {
            const response = await fetch('/characters');
            const result = await response.json();

            if (response.ok && result.data) {
                console.log('Personaggi caricati con successo:', result.data);
                return result.data;
            }

            console.error('Errore nel recupero dei dati:', result.message || 'Risposta non valida');
            return {};
        } catch (error) {
            console.error('Errore nella richiesta:', error.message);
            return {};
        }
    }

    /**
     * Crea una card HTML per un personaggio.
     * @param {string} characterName - Nome del personaggio.
     * @returns {HTMLElement} Elemento della card.
     */
    function createCharacterCard(characterName) {
        const card = document.createElement('div');
        card.classList.add('character-card');

        // Percorso immagine basato sul nome del personaggio
        const imageName = `${characterName.replace(/\s+/g, '')}.jpg`;

        card.innerHTML = `
            <img 
                src="/images/IMG_Characters/${imageName}" 
                alt="${characterName}" 
                class="character-image" 
                onerror="this.onerror=null; this.src='https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';" 
            />
            <h3 class="character-name">${characterName}</h3>
            <button 
                class="details-button" 
                data-character-name="${encodeURIComponent(characterName)}"
            >
                Dettagli
            </button>
        `;
        console.log(card)
        // Aggiungi evento al pulsante "Dettagli"
        card.querySelector('.details-button').addEventListener('click', () => {
            window.location.href = `/characterpage.html?id=${encodeURIComponent(characterName)}`;
        });

        return card;
    }

    /**
     * Popola la pagina con i personaggi raggruppati per tipo.
     * @param {Object} charactersByType - Oggetto contenente i personaggi raggruppati per tipo.
     */
    function populateCharacters(charactersByType) {
        charactersContainer.innerHTML = ''; // Svuota il contenitore

        if (Object.keys(charactersByType).length === 0) {
            charactersContainer.innerHTML = '<p>Nessun personaggio trovato.</p>';
            return;
        }

        for (const type in charactersByType) {
            const typeHeader = document.createElement('h2');
            typeHeader.classList.add('type-header');
            typeHeader.textContent = type;

            const typeContainer = document.createElement('div');
            typeContainer.classList.add('type-container');

            charactersByType[type].forEach((characterName) => {
                const characterCard = createCharacterCard(characterName);
                typeContainer.appendChild(characterCard);
            });

            charactersContainer.appendChild(typeHeader);
            charactersContainer.appendChild(typeContainer);
        }
    }

    /**
     * Gestisce la ricerca dei personaggi in base alla query.
     * @param {string} query - Query di ricerca.
     */
    async function handleSearch(query) {
        if (query.length === 0) {
            populateCharacters(allCharacters);
            return;
        }

        try {
            const response = await fetch(`/characters/search?q=${encodeURIComponent(query)}`);
            const result = await response.json();

            if (response.ok && result.success) {
                const groupedCharacters = result.data.reduce((acc, character) => {
                    const type = character.characterType || 'Unknown';
                    if (!acc[type]) {
                        acc[type] = [];
                    }
                    acc[type].push(character.characterName);
                    return acc;
                }, {});

                populateCharacters(groupedCharacters);
            } else {
                console.error('Errore nella ricerca:', result.message || 'Risposta non valida');
                populateCharacters({});
            }
        } catch (error) {
            console.error('Errore durante la ricerca:', error.message);
            populateCharacters({});
        }
    }

    // Aggiunge l'evento alla barra di ricerca
    searchBar.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        handleSearch(query);
    });

    // Inizializza la pagina caricando tutti i personaggi
    allCharacters = await fetchCharacters();
    populateCharacters(allCharacters);
});
