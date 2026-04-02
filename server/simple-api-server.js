const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 4001;
const DATA_FOLDER = path.join(__dirname, 'simple-data');

// Ensure data folder exists
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// --- SIMPLE API LOGIC ---

// 1. Get available loadouts
function getLoadouts() {
    return [
        { id: 'sniper', name: 'Sniper Class', weapons: ['Sniper', 'Pistol'], description: 'Long-range precision' },
        { id: 'heavy', name: 'Heavy Class', weapons: ['Shotgun', 'Minigun'], description: 'Close-quarters power' },
        { id: 'assault', name: 'Assault Class', weapons: ['Rifle', 'SMG'], description: 'Balanced combat' }
    ];
}

// 2. Get available maps
function getMaps() {
    return [
        { id: 'desert', name: 'Desert Storm', description: 'Hot desert environment' },
        { id: 'city', name: 'Night City', description: 'Urban nighttime setting' },
        { id: 'frozen', name: 'Frozen Base', description: 'Arctic military base' }
    ];
}

// 3. Save game session
function saveGameSession(sessionData) {
    const sessionFile = path.join(DATA_FOLDER, `session_${Date.now()}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    return { success: true, sessionId: sessionData.sessionId };
}

// 4. Get session history
function getSessionHistory() {
    try {
        const files = fs.readdirSync(DATA_FOLDER);
        const sessions = files
            .filter(file => file.startsWith('session_'))
            .map(file => {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8'));
                return data;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return sessions;
    } catch (error) {
        return [];
    }
}

// --- SIMPLE API SERVER ---

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 1. GET Loadouts
    if (pathname === '/api/simple/loadouts' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getLoadouts()));
    }

    // 2. GET Maps
    else if (pathname === '/api/simple/maps' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getMaps()));
    }

    // 3. POST Start Game
    else if (pathname === '/api/simple/start-game' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { loadout, map } = JSON.parse(body);
                
                const sessionData = {
                    sessionId: `session_${Date.now()}`,
                    loadout: loadout,
                    map: map,
                    timestamp: new Date().toISOString(),
                    status: 'started'
                };

                saveGameSession(sessionData);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: `Match started on ${map} with ${loadout}`,
                    session: sessionData
                }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    // 4. GET Session History
    else if (pathname === '/api/simple/history' && req.method === 'GET') {
        const history = getSessionHistory();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(history));
    }

    // 5. POST Save Score
    else if (pathname === '/api/simple/save-score' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { sessionId, score, kills, deaths } = JSON.parse(body);
                
                // Update session with score
                const sessionFile = path.join(DATA_FOLDER, `${sessionId}.json`);
                if (fs.existsSync(sessionFile)) {
                    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
                    sessionData.score = score;
                    sessionData.kills = kills;
                    sessionData.deaths = deaths;
                    sessionData.status = 'completed';
                    sessionData.endTime = new Date().toISOString();
                    
                    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Score saved successfully',
                    finalScore: score
                }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Simple API Endpoint not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Simple API Server running on http://localhost:${PORT}`);
    console.log(`🎮 Simple Demo API ready: /api/simple/loadouts, /api/simple/maps, /api/simple/start-game`);
});