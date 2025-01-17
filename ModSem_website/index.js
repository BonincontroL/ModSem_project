// Configurazione dell'endpoint diretto GraphDB
const graphDBEndpoint = "http://localhost:7200/repositories/Test";

let activeButton = null; // Variabile per tracciare il bottone attivo
let isLoading = false; // Stato globale per il caricamento

// Configurazione di Axios
const axiosInstance = axios.create({
    baseURL: graphDBEndpoint,
    timeout: 10000,
    headers: {
        "Content-Type": "application/sparql-query",
        Accept: "application/sparql-results+json",
    },
});



// Query SPARQL basate sulla tua antologia
const queries = {
    1: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?game ?name
        WHERE {
        ?game rdf:type ex:Story_Game .
        ?game ex:Name ?name .
        }`,
    2: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT (COUNT(?game) AS ?multiPlayerGames)
        WHERE { ?game ex:MultiPlayerMode true . }`,
    3: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?theme (COUNT(?game) AS ?count)
        WHERE { ?game ex:hasTheme ?theme . }
        GROUP BY ?theme`,
    4: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?game ?developer
        WHERE { ?game ex:DevBy ?developer . }`,
    5: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?game ?name
        WHERE { ?game ex:hasTheme "Fantasy" ; ex:Name ?name . }`,
    6: `
        PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?killerName ?victimName
        WHERE {
            ?killer ex:kills ?victim .
            ?killer ex:Name ?killerName .
            ?victim ex:Name ?victimName .
        }`,
    7: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>

        SELECT ?game ?name
        WHERE {
        SERVICE <https://query.wikidata.org/sparql> {
            ?game wdt:P31 wd:Q7889 ;
                wdt:P1476 ?name .
        }
        }
        LIMIT 10`,
    8: `PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?theme (COUNT(?game) AS ?count)
        WHERE { ?game ex:hasTheme ?theme . }
        GROUP BY ?theme
        HAVING (COUNT(?game) > 2)`,
    9:`PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?characterName
        WHERE {
        ?character ex:isProtagonistOf ?game .
        ?game ex:Name ?gameName .
        ?character ex:Name ?characterName .
        FILTER(STR(?gameName) = "TheLastOfUs") .
        }`,
    10:`PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
        PREFIX odp: <http://www.ontologydesignpatterns.org/cp/owl/bag.owl#>
        SELECT ?gameName
        WHERE {
        ?studio ex:Name "Fifa2021"@en .
        ?studio ex:DevBy ?game .
        ?game ex:Name ?gameName .
        }`,
	11:`PREFIX ex: <http://www.semanticweb.org/loren_16pbl1h/ontologies/2025/0/Games_Ontology/>
       PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        SELECT ?s ?p ?o
        WHERE {
        SERVICE <https://query.wikidata.org/sparql> {
            ?s ?p ?o .
        }
        }
        LIMIT 10`
    
};

//Descrizioni delle query per la visualizzazione
const queryDescriptions = {
    1: "Giochi di tipo story_Game con i rispettivi nomi.",
    2: "Numero totale di giochi che supportano la modalità multiplayer.",
    3: "Temi associati ai giochi con il conteggio per ciascun tema.",
    4: "Elenco dei giochi con i rispettivi sviluppatori.",
    5: "Giochi a tema Fantasy con i rispettivi nomi.",
    6: "Trova i personaggi che hanno ucciso altri personaggi",
    7: "Giochi con il loro nome e la loro etichetta Wikidata.",
    8: "Temi con almeno 3 giochi associati e il conteggio per ciascun tema.",
    9: "Protagonisti principali del gioco The Last of Us.",
    10: "Giochi sviluppati dallo studio Fifa2021.",
	11: "Giochi basati su film con il nome del gioco e il nome del film."
};


/**
 * Inizializza la pagina con il primo bottone attivo
 */
function init() {
    const firstButton = document.getElementById("btn-query-1");
    setActiveButton(firstButton);
    runQuery(1);
}

/**
 * Imposta il bottone attivo
 * @param {HTMLElement} button - Bottone selezionato
 */
function setActiveButton(button) {
    if (activeButton) {
        activeButton.classList.remove("active");
    }
    button.classList.add("active");
    activeButton = button;
}

/**
 * Mostra o nasconde la barra di caricamento
 * @param {boolean} isLoadingState - Stato del caricamento
 */
function toggleLoading(isLoadingState) {
    const loadingDiv = document.getElementById("loading");

    if (!loadingDiv) {
        console.error("Loader element not found in DOM!");
        return;
    }

    if (isLoadingState) {
        loadingDiv.classList.remove("hidden");
    } else {
        loadingDiv.classList.add("hidden");
    }
    isLoading = isLoadingState;
    //console.log(`Loading state: ${isLoading ? "Visible" : "Hidden"}`);
}

/**
 * Mostra un messaggio di errore nell'area dei risultati
 * @param {string} message - Messaggio di errore
 */
function showError(message) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
}

/**
 * Mostra i risultati della query
 * @param {Object} data - I risultati della query in formato JSON.
 */
/**
 * Mostra i risultati della query e la relativa descrizione
 * @param {Object} data - I risultati della query in formato JSON.
 * @param {string} description - Descrizione in linguaggio naturale della query.
 */
function renderResults(data, description) {
    //console.log("Risultati della query:", data);
    const resultsDiv = document.getElementById("results");

    // Pulisci l'area dei risultati
    resultsDiv.innerHTML = "";

    // Mostra la descrizione della query
    const descriptionDiv = document.createElement("div");
    descriptionDiv.style.marginBottom = "20px";
    descriptionDiv.style.fontWeight = "bold";
    descriptionDiv.textContent = `Query: ${description}`;
    resultsDiv.appendChild(descriptionDiv);

    if (!data.results || !data.results.bindings.length) {
        resultsDiv.innerHTML += "<p>Nessun risultato trovato.</p>";
        return;
    }

    // Crea una tabella per i risultati
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    Object.keys(data.results.bindings[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        th.style.textAlign = "left";
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.results.bindings.forEach((row) => {
        const tableRow = document.createElement("tr");
        Object.values(row).forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value.value;
            td.style.border = "1px solid #ddd";
            td.style.padding = "8px";
            tableRow.appendChild(td);
        });
        tbody.appendChild(tableRow);
    });
    table.appendChild(tbody);

    resultsDiv.appendChild(table);
}


/**
 * Esegue una query selezionata
 * @param {number} queryNumber - Numero della query
 */
async function runQuery(queryNumber) {
    if (isLoading) {
        console.warn("Una richiesta è già in corso!");
        return;
    }

    const resultsDiv = document.getElementById("results");
    const query = queries[queryNumber];
    const description = queryDescriptions[queryNumber];

    // Imposta il bottone attivo
    const clickedButton = document.getElementById(`btn-query-${queryNumber}`);
    setActiveButton(clickedButton);

    // Mostra il loader e pulisce i risultati
    toggleLoading(true);
    resultsDiv.innerHTML = "";

    try {
        console.log(`Esecuzione query SPARQL: ${query}`);
        const response = await axiosInstance.post("", query);
        console.log("Risposta:", response.data);
        renderResults(response.data, description);
    } catch (error) {
        handleRequestError(error);
    } finally {
        toggleLoading(false);
    }
}


/**
 * Gestisce errori di richiesta in modo centralizzato
 * @param {Object} error - Oggetto errore restituito da Axios
 */
function handleRequestError(error) {
    // Controllo se l'errore riguarda il timeout della richiesta
    if (error.code === "ECONNABORTED") {
        showError("La richiesta ha superato il tempo limite. Riprova più tardi.");
    }
    // Controllo se l'errore è legato alla risposta ricevuta dal server
    else if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        
        // Errore lato server (500 e simili)
        if (status >= 500 && status < 600) {
            showError(`Errore del server (${status}): ${statusText}. Riprova più tardi.`);
        }
        // Errore lato client (400 e simili)
        else if (status >= 400 && status < 500) {
            showError(`Errore di richiesta (${status}): ${statusText}. Verifica i dati inviati.`);
        } 
        // Altri errori HTTP
        else {
            showError(`Errore ${status}: ${statusText}`);
        }
    }
    // Controllo se la richiesta è stata inviata ma non c'è stata risposta (probabile errore di rete)
    else if (error.request) {
        showError("Il server non ha risposto. Controlla la tua connessione o riprova più tardi.");
    }
    // Se non è possibile identificare la causa dell'errore
    else {
        showError("Si è verificato un errore inatteso. Prova a ripetere l'operazione.");
    }
    console.error("Errore nella richiesta:", error);
}

