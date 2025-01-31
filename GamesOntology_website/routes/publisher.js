const express = require('express');
const axios = require('axios');
const router = express.Router();

//const GRAPHDB_ENDPOINT = 'http://DESKTOP-I2LA02Q:7200/repositories/videogame_ontology';
const GRAPHDB_ENDPOINT = 'http://localhost:7200/repositories/videogame_ontology';


// Route per la lista dei publisher e i giochi pubblicati
router.get('/', async (req, res) => {
    const sparqlQuery = `
    PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?game ?gameName ?publisher ?publisherName
    WHERE {
        ?game ex:DevBy ?publisher ;
              ex:Name ?gameName .
        ?publisher ex:Name ?publisherName .
    }
    ORDER BY ?publisherName ?gameName
    `;

    try {
        const response = await axios.post(GRAPHDB_ENDPOINT, sparqlQuery, {
            headers: { 'Content-Type': 'application/sparql-query' },
        });

        const results = response.data.results.bindings.map((binding) => ({
            game: binding.game?.value,
            gameName: binding.gameName?.value,
            publisher: binding.publisher?.value,
            publisherName: binding.publisherName?.value,
        }));

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Errore nella query SPARQL per i publisher:', error.message);
        res.status(500).json({ success: false, message: 'Errore nella query SPARQL' });
    }
});







module.exports = router;