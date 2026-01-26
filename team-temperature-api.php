<?php
// Enkel API for å håndtere team-temperature data

// Konfigurering av sikkerhet
$config = [
    'allowed_origins' => ['http://localhost', 'https://localhost', 'http://127.0.0.1', 'null'], // Tillatte domener
];

// CORS-håndtering - kun tillat spesifikke domener
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $config['allowed_origins'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Hvis ikke i listen, tillat bare samme domene
    header('Access-Control-Allow-Origin: ' . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'null'));
}
header('Content-Type: application/json');

// Sjekk metode
$method = $_SERVER['REQUEST_METHOD'];

// Loggfil for feilsøking
$logFile = 'team-temperature-api.log';

function writeLog($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Responsfunksjon - ikke avslør sensitive detaljer
function sendResponse($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Hvis metoden er OPTIONS (preflight CORS-forespørsel)
if ($method == 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// JSON-filsti med sikker plassering (utenfor web-root om mulig)
$jsonFile = 'team-temperature.json';

// For GET-forespørsler - returnerer data
if ($method === 'GET') {
    if (file_exists($jsonFile)) {
        $jsonData = file_get_contents($jsonFile);
        if ($jsonData === false) {
            sendResponse(500, 'Kunne ikke lese JSON-filen.');
        }
        $data = json_decode($jsonData, true);
        sendResponse(200, 'Data hentet', $data);
    } else {
        sendResponse(404, 'JSON-filen finnes ikke.');
    }
}

// Håndter POST-forespørsler
if ($method !== 'POST') {
    sendResponse(405, 'Metoden er ikke tillatt. Bruk GET eller POST.');
}

// Hent forespørselens innhold for POST
$requestData = json_decode(file_get_contents('php://input'), true);

// Sjekk at action er spesifisert
if (!isset($requestData['action'])) {
    sendResponse(400, 'Handling (action) er ikke spesifisert.');
}

$action = $requestData['action'];

// Funksjon for å validere måledata
function validateMeasurement($measurement) {
    // Definer påkrevde felt
    $requiredFields = [
        'week', 'name', 'date', 'feeling', 'motivation', 'workload', 
        'stress', 'clarity', 'expectations', 'collaboration', 'communication', 
        'feedback', 'recognition', 'learning', 'obstacles'
    ];
    
    // Sjekk at alle påkrevde felt finnes
    foreach ($requiredFields as $field) {
        if (!isset($measurement[$field])) {
            writeLog("Validering feilet: mangler felt '$field'");
            return false;
        }
    }
    
    // Valider spesifikke verdier for "learning" og "obstacles"
    if ($measurement['learning'] !== 'ja' && $measurement['learning'] !== 'nei') {
        writeLog("Validering feilet: 'learning' må være 'ja' eller 'nei', fikk '" . $measurement['learning'] . "'");
        return false;
    }
    
    if ($measurement['obstacles'] !== 'ja' && $measurement['obstacles'] !== 'nei') {
        writeLog("Validering feilet: 'obstacles' må være 'ja' eller 'nei', fikk '" . $measurement['obstacles'] . "'");
        return false;
    }
    
    // Sjekk at tallverdier faktisk er tall og innenfor gyldig område
    $numericFields = [
        'feeling', 'motivation', 'workload', 'stress', 'clarity', 
        'expectations', 'collaboration', 'communication', 'feedback', 'recognition'
    ];
    
    foreach ($numericFields as $field) {
        if (!is_numeric($measurement[$field]) || $measurement[$field] < 1 || $measurement[$field] > 5) {
            writeLog("Validering feilet: '$field' må være et tall mellom 1 og 5");
            return false;
        }
    }
    
    // Sjekk at uke er gyldig
    if (!is_numeric($measurement['week']) || $measurement['week'] < 1 || $measurement['week'] > 53) {
        writeLog("Validering feilet: 'week' må være et tall mellom 1 og 53");
        return false;
    }
    
    // Sjekk dato-format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $measurement['date'])) {
        writeLog("Validering feilet: 'date' må være på format YYYY-MM-DD");
        return false;
    }
    
    // Sjekk at hvis obstacles er 'ja', så bør obstaclesComment være satt
    if ($measurement['obstacles'] === 'ja' && empty($measurement['obstaclesComment'])) {
        // Dette er ikke en blokkerende feil, bare en advarsel
        writeLog("Advarsel: 'obstacles' er 'ja' men 'obstaclesComment' er tom");
    }
    
    return true;
}

// Funksjon for å sanitere brukerinput
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            if ($key === 'obstaclesComment' || $key === 'generalComment' || $key === 'name') {
                // Sanitere tekstfeltene for å forhindre XSS
                $data[$key] = htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
            }
        }
    }
    return $data;
}

// Utfør handlingen
switch ($action) {
    case 'get_data':
        try {
            if (file_exists($jsonFile)) {
                $jsonData = file_get_contents($jsonFile);
                if ($jsonData === false) {
                    sendResponse(500, 'Kunne ikke lese JSON-filen.');
                }
                $data = json_decode($jsonData, true);
                sendResponse(200, 'Data hentet', $data);
            } else {
                sendResponse(404, 'JSON-filen finnes ikke.');
            }
        } catch (Exception $e) {
            writeLog("Feil ved henting av data: " . $e->getMessage());
            sendResponse(500, 'Feil ved henting av data.');
        }
        break;

    case 'add_measurement':
        try {
            // Sjekk at måledata er spesifisert
            if (!isset($requestData['measurement'])) {
                sendResponse(400, 'Ingen måledata å lagre.');
            }
            
            $measurement = $requestData['measurement'];
            
            // Valider måledata før lagring
            if (!validateMeasurement($measurement)) {
                sendResponse(400, 'Ugyldig måledata. Sjekk at alle felt er korrekt utfylt.');
            }
            
            // Sanitere måledata
            $measurement = sanitizeInput($measurement);
            
            // Hent eksisterende data
            if (file_exists($jsonFile)) {
                $jsonData = file_get_contents($jsonFile);
                $data = json_decode($jsonData, true);
            } else {
                $data = [
                    'teamSize' => 9,
                    'temperatureData' => [],
                    'exportDate' => date('c')
                ];
            }
            
            // Legg til ny måling
            $data['temperatureData'][] = $measurement;
            $data['exportDate'] = date('c');
            
            // Lagre til filen med eksklusive rettigheter for å forhindre race-conditions
            if (file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX)) {
                writeLog("Ny måling lagret");
                sendResponse(200, 'Måling er lagret.', $data);
            } else {
                writeLog("Kunne ikke skrive til JSON-filen");
                sendResponse(500, 'Kunne ikke lagre måling. Sjekk filtillatelser.');
            }
        } catch (Exception $e) {
            writeLog("Feil ved lagring av måling: " . $e->getMessage());
            sendResponse(500, 'Feil ved lagring av måling.');
        }
        break;

    case 'update_team_size':
        try {
            // Sjekk at teamSize er spesifisert
            if (!isset($requestData['teamSize'])) {
                sendResponse(400, 'Ingen teamstørrelse å lagre.');
            }
            
            // Valider teamSize
            $teamSize = (int)$requestData['teamSize'];
            if ($teamSize < 1 || $teamSize > 100) {
                sendResponse(400, 'Ugyldig teamstørrelse. Verdien må være mellom 1 og 100.');
            }
            
            // Hent eksisterende data
            if (file_exists($jsonFile)) {
                $jsonData = file_get_contents($jsonFile);
                $data = json_decode($jsonData, true);
            } else {
                $data = [
                    'teamSize' => 9,
                    'temperatureData' => [],
                    'exportDate' => date('c')
                ];
            }
            
            // Oppdater teamSize
            $data['teamSize'] = $teamSize;
            $data['exportDate'] = date('c');
            
            // Lagre til filen med eksklusive rettigheter
            if (file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX)) {
                writeLog("Teamstørrelse oppdatert til $teamSize");
                sendResponse(200, 'Teamstørrelse er oppdatert.', $data);
            } else {
                writeLog("Kunne ikke skrive til JSON-filen");
                sendResponse(500, 'Kunne ikke oppdatere teamstørrelse. Sjekk filtillatelser.');
            }
        } catch (Exception $e) {
            writeLog("Feil ved oppdatering av teamstørrelse");
            sendResponse(500, 'Feil ved oppdatering av teamstørrelse.');
        }
        break;
        
    case 'clear_all_data':
        try {
            // Sjekk om filen eksisterer
            if (!file_exists($jsonFile)) {
                sendResponse(404, 'JSON-filen finnes ikke.');
            }

            // Opprett tomt datasett, men behold teamSize
            if (file_exists($jsonFile)) {
                $currentData = json_decode(file_get_contents($jsonFile), true);
                $teamSize = isset($currentData['teamSize']) ? $currentData['teamSize'] : 9;
            } else {
                $teamSize = 9;
            }

            $emptyData = [
                'teamSize' => $teamSize,
                'temperatureData' => [],
                'exportDate' => date('c')
            ];

            // Skriv til filen med eksklusive rettigheter
            if (file_put_contents($jsonFile, json_encode($emptyData, JSON_PRETTY_PRINT), LOCK_EX)) {
                writeLog("Data slettet fra JSON-filen");
                sendResponse(200, 'Alle data er slettet fra JSON-filen.', $emptyData);
            } else {
                writeLog("Kunne ikke skrive til JSON-filen");
                sendResponse(500, 'Kunne ikke skrive til JSON-filen. Sjekk filtillatelser.');
            }
        } catch (Exception $e) {
            writeLog("Feil ved sletting av data");
            sendResponse(500, 'Feil ved sletting av data.');
        }
        break;
        
    case 'save_data':
        try {
            // Sjekk at data er spesifisert
            if (!isset($requestData['data'])) {
                sendResponse(400, 'Ingen data å lagre.');
            }
            
            // Skriv til filen med eksklusive rettigheter
            if (file_put_contents($jsonFile, json_encode($requestData['data'], JSON_PRETTY_PRINT), LOCK_EX)) {
                writeLog("Data lagret til JSON-filen");
                sendResponse(200, 'Data er lagret til JSON-filen.', $requestData['data']);
            } else {
                writeLog("Kunne ikke skrive til JSON-filen");
                sendResponse(500, 'Kunne ikke skrive til JSON-filen. Sjekk filtillatelser.');
            }
        } catch (Exception $e) {
            writeLog("Feil ved lagring av data");
            sendResponse(500, 'Feil ved lagring av data.');
        }
        break;
        
    default:
        sendResponse(400, 'Ukjent handling: ' . $action);
}
?>