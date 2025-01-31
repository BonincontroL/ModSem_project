const express = require('express');
const axios = require('axios');
const router = express.Router();
const a = 0;

//const GRAPHDB_ENDPOINT = 'http://DESKTOP-I2LA02Q:7200/repositories/videogame_ontology';

const GRAPHDB_ENDPOINT = 'http://localhost:7200/repositories/videogame_ontology';

// Route per ottenere tutti i personaggi suddivisi per sottoclasse
router.get('/', async (req, res) => {
    const sparqlQuery = `
    PREFIX : <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?character ?characterName ?characterType
    WHERE {
      ?character rdf:type ?characterType ;
                 :Name ?characterName .
      ?characterType rdfs:subClassOf :Character .
      FILTER(isIRI(?character))  # Escludi nodi anonimi
      FILTER(isIRI(?characterType))  # Assicura che ?characterType abbia un URI
    }
    ORDER BY ?characterName ?characterType
    `;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: {'Content-Type': 'application/sparql-query'},
        });

        const results = response.data.results.bindings;

        // Raggruppa i personaggi per sottoclasse
        const groupedCharacters = {};
        results.forEach((binding) => {
            const characterType = binding.characterType.value.split(/[\/#]/).pop(); // Nome della sottoclasse
            const characterName = binding.characterName.value;

            if (!groupedCharacters[characterType]) {
                groupedCharacters[characterType] = [];
            }
            groupedCharacters[characterType].push(characterName);
        });

        res.json({success: true, data: groupedCharacters});
    } catch (error) {
        console.error('Errore nella query SPARQL:', error.message);
        res.status(500).json({success: false, message: 'Errore nella query SPARQL'});
    }
});
// Route per la ricerca dei personaggi
router.get('/search', async (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery) {
        return res.status(400).json({success: false, message: 'Search query is required'});
    }

    const sparqlQuery = `
    PREFIX : <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?character ?characterName ?characterType
    WHERE {
        ?character rdf:type ?characterType ;
                   :Name ?characterName .
        ?characterType rdfs:subClassOf* :Character .
        FILTER(STRSTARTS(LCASE(?characterName), LCASE("${searchQuery}")))
    }
    ORDER BY ?characterName
    `;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: {'Content-Type': 'application/sparql-query'},
        });

        const results = response.data.results.bindings;

        const characters = results.map((binding) => ({
            character: binding.character.value,
            characterName: binding.characterName.value,
            characterType: binding.characterType.value.split(/[\/#]/).pop(),
        }));

        res.json({success: true, data: characters});
    } catch (error) {
        console.error('Errore nella query SPARQL:', error.message);
        res.status(500).json({success: false, message: 'Errore nella query SPARQL'});
    }
});


// Route per ottenere i dettagli di un personaggio
router.get('/details', async (req, res) => {
    const characterId = req.query.id;

    if (!characterId) {
        return res.status(400).json({ success: false, message: 'Character ID is required' });
    }

    const sparqlQuery = `
    PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?name ?age ?gender ?gameName ?relationshipName ?assetName ?mapName WHERE {
      ex:${characterId} a ex:Character ;
                        ex:Name ?name ;
                        ex:Age ?age ;
                        ex:hasSex ?gender .
      OPTIONAL {
        ex:${characterId} ex:AppearsIn ?game .
        ?game ex:Name ?gameName .
      }
      OPTIONAL {
        ex:${characterId} ex:hasRelative ?relative .
        ?relative ex:Name ?relationshipName .
      }
      OPTIONAL {
        ex:${characterId} ex:hasAsset ?asset .
        ?asset ex:Name ?assetName .
      }
      OPTIONAL {
        ex:${characterId} ex:isVillagerOf ?map .
        ?map ex:Name ?mapName .
      }
    }
    `;

    try {
        console.log(`Eseguendo query su GraphDB per ID personaggio: ${characterId}`);
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: { 'Content-Type': 'application/sparql-query' },
        });

        const bindings = response.data.results.bindings;

        // Organizza i dati
        const characterDetails = {
            name: bindings[0]?.name?.value || 'N/A',
            age: bindings[0]?.age?.value || 'N/A',
            gender: bindings[0]?.gender?.value || 'N/A',
            games: [...new Set(bindings.map((binding) => binding.gameName?.value).filter(Boolean))],
            relationships: [...new Set(bindings.map((binding) => binding.relationshipName?.value).filter(Boolean))],
            assets: [...new Set(bindings.map((binding) => binding.assetName?.value).filter(Boolean))],
            map: bindings[0]?.mapName?.value || 'N/A',
        };

        res.json({ success: true, data: characterDetails });
    } catch (error) {
        console.error('Errore durante l\'esecuzione della query SPARQL:', error.message);

        if (error.response) {
            console.error('Dettagli errore dalla risposta:', error.response.data);
        }

        res.status(500).json({ success: false, message: 'Errore durante l\'esecuzione della query SPARQL' });
    }
});


module.exports = router;


