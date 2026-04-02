const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 4003;
const DATA_FOLDER = path.join(__dirname, 'black-vortex-data');

// Ensure data folder exists
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// --- BLACK VORTEX FPS API LOGIC ---

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
            bestKills: Math.max(...playerStats.map(s => s.kills || 0)),
            bestWave: Math.max(...playerStats.map(s => s.wave || 0))
        };
    } catch (error) {
        return null;
    }
}

// 4. Generate enemy spawn positions
function generateEnemySpawns(count, playerPosition) {
    const spawns = [];
    for (let i = 0; i < count; i++) {
        // Spawn enemies in a circle around the player
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + (Math.random() * 50);
        
        spawns.push({
            x: (playerPosition?.x || 0) + Math.cos(angle) * distance,
            y: 0,
            z: (playerPosition?.z || 0) + Math.sin(angle) * distance,
            wave: playerPosition?.wave || 1
        });
    }
    return spawns;
}

// 5. Get weapon stats
function getWeaponStats() {
    return {
        pistol: { name: 'Pistol', damage: 25, ammo: 12, maxAmmo: 48, reloadTime: 1.2, fireRate: 0.2, spread: 0.02, recoil: 0.05 },
        smg: { name: 'SMG', damage: 15, ammo: 30, maxAmmo: 120, reloadTime: 1.5, fireRate: 0.08, spread: 0.05, recoil: 0.02 },
        rifle: { name: 'Rifle', damage: 35, ammo: 30, maxAmmo: 90, reloadTime: 2.0, fireRate: 0.15, spread: 0.01, recoil: 0.08 },
        shotgun: { name: 'Shotgun', damage: 50, ammo: 8, maxAmmo: 32, reloadTime: 2.5, fireRate: 0.8, spread: 0.2, recoil: 0.2 }
    };
}

function getMapRotation() {
    return [
        { name: 'Neon Foundry', style: 'catwalks', pace: 'fast', description: 'Molten core lanes and elevated catwalks' },
        { name: 'Dust Sector 9', style: 'long-lanes', pace: 'tactical', description: 'Desert refineries with long flanking lanes' },
        { name: 'Skybreak Port', style: 'docks', pace: 'vertical', description: 'Storm-lit cargo roofs and drop lanes' },
        { name: 'Frozen Relay', style: 'bunkers', pace: 'balanced', description: 'Ice relay bunkers and whiteout sightlines' },
        { name: 'Obsidian Labs', style: 'labs', pace: 'competitive', description: 'Black-glass corridors and mirrored routes' },
        { name: 'Crimson Alley', style: 'alleys', pace: 'close-quarters', description: 'Tight city choke points and ambush corners' }
    ];
}

function getModeRotation() {
    return [
        { id: 'quick-match', name: 'Arena Clash', targetScore: 20, timeLimit: 240 },
        { id: 'ranked', name: 'Circuit Crown', targetScore: 30, timeLimit: 300 },
        { id: 'arsenal-rush', name: 'Arsenal Rush', targetScore: 22, timeLimit: 330 }
    ];
}

function getLoadouts() {
    return [
        { name: 'Sniper Set', starter: 'rifle', focus: 'precision' },
        { name: 'Heavy Set', starter: 'shotgun', focus: 'frontline' },
        { name: 'Stealth Set', starter: 'smg', focus: 'mobility' },
        { name: 'Assault Set', starter: 'rifle', focus: 'balanced' },
        { name: 'Tactical Set', starter: 'smg', focus: 'control' },
        { name: 'Survival Set', starter: 'pistol', focus: 'endurance' }
    ];
}

// --- BLACK VORTEX FPS API SERVER ---

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
    if (pathname === '/api/black-vortex/save-stats' && req.method === 'POST') {
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
    else if (pathname === '/api/black-vortex/leaderboard' && req.method === 'GET') {
        const leaderboard = getLeaderboard();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leaderboard));
    }

    // 3. GET Player Stats
    else if (pathname === '/api/black-vortex/player-stats' && req.method === 'GET') {
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
    else if (pathname === '/api/black-vortex/enemy-spawns' && req.method === 'GET') {
        const count = parseInt(parsedUrl.query.count) || 10;
        const playerX = parseFloat(parsedUrl.query.x) || 0;
        const playerZ = parseFloat(parsedUrl.query.z) || 0;
        const wave = parseInt(parsedUrl.query.wave) || 1;
        
        const spawns = generateEnemySpawns(count, { x: playerX, z: playerZ, wave: wave });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(spawns));
    }

    // 5. GET Weapon Stats
    else if (pathname === '/api/black-vortex/weapon-stats' && req.method === 'GET') {
        const weapons = getWeaponStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(weapons));
    }

    // 6. GET Map Rotation
    else if (pathname === '/api/black-vortex/maps' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getMapRotation()));
    }

    // 7. GET Mode Rotation
    else if (pathname === '/api/black-vortex/modes' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getModeRotation()));
    }

    // 8. GET Loadouts
    else if (pathname === '/api/black-vortex/loadouts' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getLoadouts()));
    }

    // 9. POST Update Player Position
    else if (pathname === '/api/black-vortex/update-position' && req.method === 'POST') {
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
        res.end(JSON.stringify({ message: 'Black Vortex FPS API Endpoint not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Black Vortex FPS API Server running on http://localhost:${PORT}`);
    console.log(`🎯 Black Vortex FPS API ready: /api/black-vortex/save-stats, /api/black-vortex/leaderboard, /api/black-vortex/player-stats`);
});
