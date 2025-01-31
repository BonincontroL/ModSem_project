document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');

    if (!characterId) {
        displayErrorMessage('Character not found');
        return;
    }

    try {
        const response = await fetch(`/characters/details?id=${encodeURIComponent(characterId)}`);

        if (!response.ok) {
            throw new Error('Failed to fetch character details');
        }

        const data = await response.json();

        if (data.success) {
            renderCharacterDetails(data.data);
        } else {
            displayErrorMessage(data.message || 'No character details available');
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dettagli del personaggio:', error);
        displayErrorMessage('Error loading character details');
    }
});

function displayErrorMessage(message) {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <h1>${message}</h1>
        </div>
    `;
}

function renderCharacterDetails(character) {
    const characterNameElement = document.getElementById('character-name');
    const characterAgeElement = document.getElementById('character-age');
    const characterGenderElement = document.getElementById('character-gender');
    const characterImageElement = document.getElementById('character-image');
    const gamesListElement = document.getElementById('games-list');
    const relationshipsListElement = document.getElementById('relationships-list');
    const assetsListElement = document.getElementById('assets-list');
    const characterMapElement = document.getElementById('character-map');

    if (characterNameElement) {
        characterNameElement.textContent = character.name || 'N/A';
    }

    if (characterAgeElement) {
        characterAgeElement.textContent = character.age ? `${character.age} anni` : 'N/A';
    }

    if (characterGenderElement) {
        const gender = character.gender?.split(/[\/#]/).pop();
        characterGenderElement.textContent = gender || 'N/A';
    }

    if (characterImageElement) {
        const imageName = `${character.name.replace(/\s+/g, '')}.jpg`; // Rimuove gli spazi dal nome del personaggio
        characterImageElement.src = `/images/IMG_Characters/${imageName}`;
        characterImageElement.alt = character.name || 'Character Image';
        characterImageElement.onerror = () => {
            characterImageElement.src = '/images/default-character.jpg';
        };
    }

    if (gamesListElement) {
        gamesListElement.innerHTML = '';
        if (character.games.length > 0) {
            character.games.forEach((game) => {
                const listItem = document.createElement('li');
                listItem.textContent = game;
                gamesListElement.appendChild(listItem);
            });
        } else {
            gamesListElement.innerHTML = '<li>Nessun gioco disponibile</li>';
        }
    }

    if (relationshipsListElement) {
        relationshipsListElement.innerHTML = '';
        if (character.relationships.length > 0) {
            character.relationships.forEach((relationship) => {
                const listItem = document.createElement('li');
                listItem.textContent = relationship;
                relationshipsListElement.appendChild(listItem);
            });
        } else {
            relationshipsListElement.innerHTML = '<li>Nessuna relazione disponibile</li>';
        }
    }

    if (assetsListElement) {
        assetsListElement.innerHTML = '';
        if (character.assets.length > 0) {
            character.assets.forEach((asset) => {
                const listItem = document.createElement('li');
                listItem.textContent = asset;
                assetsListElement.appendChild(listItem);
            });
        } else {
            assetsListElement.innerHTML = '<li>Nessun asset disponibile</li>';
        }
    }

    if (characterMapElement) {
        characterMapElement.textContent = character.map || 'N/A';
    }
}
