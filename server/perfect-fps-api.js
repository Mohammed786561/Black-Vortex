const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 4002;
const DATA_FOLDER = path.join(__dirname, 'perfect-data');

// Ensure data folder exists
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// --- PERFECT FPS API LOGIC ---

// 1. Save game stats
function saveGameStats(stats) {
    const statsFile = path.join(DATA_FOLDER, `stats_${Date.now()}.json`);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    return { success: true, statsId: stats.statsId };
}

// 2. Get leaderboard
function getLeaderboard() {
    try {
        const files = fs.readdirSync(DATA_FOLDER);
        const stats = files
            .filter(file => file.startsWith('stats_'))
            .map(file => {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8'));
                return data;
            })
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 10); // Top 10
        return stats;
    } catch (error) {
        return [];
    }
}

// 3. Get player stats
function getPlayerStats(playerId) {
    try {
        const files = fs.readdirSync(DATA_FOLDER);
        const playerStats = files
            .filter(file => file.startsWith('stats_'))
            .map(file => {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8'));
                return data;
            })
            .filter(stat => stat.playerId === playerId);
        
        if (playerStats.length === 0) return null;
        
        const totalScore = playerStats.reduce((sum, stat) => sum + (stat.score || 0), 0);
        const totalKills = playerStats.reduce((sum, stat) => sum + (stat.kills || 0), 0);
        const totalDeaths = playerStats.reduce((sum, stat) => sum + (stat.deaths || 0), 0);
        const gamesPlayed = playerStats.length;
        const avgScore = Math.round(totalScore / gamesPlayed);
        const avgKills = Math.round(totalKills / gamesPlayed);
        const kdr = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;
        
        return {
            playerId: playerId,
            totalScore: totalScore,
            totalKills: totalKills,
            totalDeaths: totalDeaths,
            gamesPlayed: gamesPlayed,
            avgScore: avgScore,
            avgKills: avgKills,
            kdr: kdr,
            bestScore: Math.max(...playerStats.map(s => s.score || 0)),
            bestKills: Math.max(...playerStats.map(s => s.kills || 0))
        };
    } catch (error) {
        return null;
    }
}

// 4. Generate random enemy spawn positions
function generateEnemySpawns(count) {
    const spawns = [];
    for (let i = 0; i < count; i++) {
        spawns.push({
            x: (Math.random() - 0.5) * 80,
            y: 0.5,
            z: (Math.random() - 0.5) * 80
        });
    }
    return spawns;
}

// --- PERFECT FPS API SERVER ---

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

    // 1. POST Save Stats
    if (pathname === '/api/perfect/save-stats' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const stats = JSON.parse(body);
                stats.statsId = `stats_${Date.now()}`;
                stats.timestamp = new Date().toISOString();
                
                saveGameStats(stats);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Stats saved successfully',
                    statsId: stats.statsId
                }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    // 2. GET Leaderboard
    else if (pathname === '/api/perfect/leaderboard' && req.method === 'GET') {
        const leaderboard = getLeaderboard();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leaderboard));
    }

    // 3. GET Player Stats
    else if (pathname === '/api/perfect/player-stats' && req.method === 'GET') {
        const playerId = parsedUrl.query.playerId;
        if (!playerId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Player ID required' }));
            return;
        }
        
        const stats = getPlayerStats(playerId);
        if (stats) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Player not found' }));
        }
    }

    // 4. GET Enemy Spawns
    else if (pathname === '/api/perfect/enemy-spawns' && req.method === 'GET') {
        const count = parseInt(parsedUrl.query.count) || 10;
        const spawns = generateEnemySpawns(count);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(spawns));
    }

    // 5. POST Update Player Position
    else if (pathname === '/api/perfect/update-position' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const position = JSON.parse(body);
                // Store position for analytics (optional)
                const positionFile = path.join(DATA_FOLDER, `position_${Date.now()}.json`);
                fs.writeFileSync(positionFile, JSON.stringify({
                    ...position,
                    timestamp: new Date().toISOString()
                }, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Position updated'
                }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Perfect FPS API Endpoint not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Perfect FPS API Server running on http://localhost:${PORT}`);
    console.log(`🎯 Perfect FPS API ready: /api/perfect/save-stats, /api/perfect/leaderboard, /api/perfect/player-stats`);
});