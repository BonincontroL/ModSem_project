const express = require('express');
const axios = require('axios');
const router = express.Router();

//const GRAPHDB_ENDPOINT = 'http://DESKTOP-I2LA02Q:7200/repositories/videogame_ontology';
const GRAPHDB_ENDPOINT = 'http://localhost:7200/repositories/videogame_ontology';


// Route principale per la lista dei giochi
router.get('/', async (req, res) => {
    const sparqlQuery = `
PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?game ?gameName ?gameType
WHERE {
  ?game a ?gameType ;
        ex:Name ?gameName .
  ?gameType rdfs:subClassOf ex:Game .
  FILTER(isIRI(?game))  # Assicura che ?game abbia un URI (esclude nodi anonimi)
  FILTER(isIRI(?gameType))  # Assicura che ?gameType abbia un URI
}
ORDER BY ?gameType ?gameName
`;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: {'Content-Type': 'application/sparql-query'},
        });

        const results = response.data.results.bindings.map((binding) => ({
            game: binding.game?.value,
            gameName: binding.gameName?.value,
            gameType: binding.gameType?.value.split(/[\/#]/).pop(),
        }));

        res.json({success: true, data: results});
    } catch (error) {
        console.error('Errore nella query SPARQL:', error.message);
        res.status(500).json({success: false, message: 'Errore nella query SPARQL'});
    }
});

// Route per i dettagli di un gioco
router.get('/details', async (req, res) => {
    const gameId = req.query.id;

    if (!gameId) {
        return res.status(400).json({success: false, message: 'Game ID is required'});
    }

    const sparqlQuery = `
    PREFIX : <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?name ?comment ?genreLabel ?characterLabel ?multiplayer
    WHERE {
        BIND(<${gameId}> AS ?game)
        ?game :Name ?name .
        OPTIONAL { ?game rdfs:comment ?comment . }
        OPTIONAL { ?game :hasTheme ?genre . ?genre rdfs:label ?genreLabel . }
        OPTIONAL { ?game :hasCharacter ?character . ?character :Name ?characterLabel . }
        OPTIONAL { ?game :MultiPlayerMode ?multiplayer . }
    }
    `;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: {'Content-Type': 'application/sparql-query'},
        });

        const bindings = response.data.results.bindings;

        if (bindings.length === 0) {
            return res.status(404).json({success: false, message: 'Game not found'});
        }

        // Elaborare i risultati per rimuovere duplicati
        const gameDetails = {
            name: bindings[0]?.name?.value || null,
            comment: bindings[0]?.comment?.value || null,
            genre: [...new Set(bindings.map(b => b.genreLabel?.value).filter(Boolean))],
            characters: [...new Set(bindings.map(b => b.characterLabel?.value).filter(Boolean))],
            multiplayerMode: bindings[0]?.multiplayer?.value === 'true',
        };

        res.json({success: true, data: gameDetails});
    } catch (error) {
        console.error('Errore nella query SPARQL:', error.message);
        res.status(500).json({success: false, message: 'Errore nella query SPARQL'});
    }
});

router.get('/search', async (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery) {
        return res.status(400).json({success: false, message: 'Search query is required'});
    }

    const sparqlQuery = `
    PREFIX : <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?game ?gameName ?gameType
    WHERE {
        ?game a ?gameType ;
              :Name ?gameName .
        ?gameType rdfs:subClassOf :Game .
        FILTER (STRSTARTS(LCASE(?gameName), "${searchQuery.toLowerCase()}"))
    }
    ORDER BY ?gameName
    `;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: {'Content-Type': 'application/sparql-query'},
        });

        const results = response.data.results.bindings.map((binding) => ({
            game: binding.game?.value,
            gameName: binding.gameName?.value,
            gameType: binding.gameType?.value.split(/[\/#]/).pop(),
        }));

        res.json({success: true, data: results});
    } catch (error) {
        console.error('Errore nella query SPARQL:', error.message);
        res.status(500).json({success: false, message: 'Errore nella query SPARQL'});
    }
});
const gameWikidataIds = {
    "The Last of Us": "Q1986744",
    "Hearthstone": "Q58881923",
    "Final Fantasy X": "Q223381",
    "Minecraft": "Q49740",
    "Red Dead Redemption": "Q548203",
    "Red Dead Redemption 2": "Q27438121",
    "The Last of Us 2": "Q27950674",
    "Rocket League": "Q20031743",
    "Horizon Zero Dawn": "Q20155528"
};

// Route per recuperare gli anni di rilascio dei giochi da Wikidata
router.get('/releaseYears', async (req, res) => {
    const sparqlQuery = `
    SELECT ?gameLabel ?releaseYear WHERE {
        VALUES ?game { ${Object.values(gameWikidataIds).map(id => `wd:${id}`).join(' ')} }
        ?game wdt:P577 ?releaseDate .
        BIND(YEAR(?releaseDate) AS ?releaseYear)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } ORDER BY ?gameLabel
    `;

    try {
        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: { query: sparqlQuery, format: 'json' }
        });

        const results = response.data.results.bindings.map(binding => ({
            game: binding.gameLabel.value,
            releaseYear: binding.releaseYear.value
        }));

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Errore durante la query a Wikidata:', error.message);
        res.status(500).json({ success: false, message: 'Errore durante la query a Wikidata' });


    }
});
// Route per recuperare le piattaforme di rilascio dei giochi da Wikidata
router.get('/platforms', async (req, res) => {
    const sparqlQuery = `
    SELECT ?gameLabel ?platformLabel WHERE {
        VALUES ?game { ${Object.values(gameWikidataIds).map(id => `wd:${id}`).join(' ')} }
        ?game wdt:P400 ?platform .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } ORDER BY ?gameLabel ?platformLabel
    `;

    try {
        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: { query: sparqlQuery, format: 'json' }
        });

        const results = response.data.results.bindings.map(binding => ({
            game: binding.gameLabel.value,
            platform: binding.platformLabel.value
        }));

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Errore durante la query a Wikidata:', error.message);
        res.status(500).json({ success: false, message: 'Errore durante la query a Wikidata' });
    }
});





module.exports = router;
