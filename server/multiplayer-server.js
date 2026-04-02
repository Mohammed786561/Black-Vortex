const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const PORT = process.env.MULTIPLAYER_PORT || 4010;
const TICK_RATE = 20;
const WORLD = { width: 2400, height: 1500 };

const MAPS = {
  'Neon Foundry': {
    name: 'Neon Foundry',
    obstacles: [
      { x: 420, y: 250, w: 240, h: 120 }, { x: 930, y: 200, w: 420, h: 90 },
      { x: 1540, y: 320, w: 180, h: 320 }, { x: 560, y: 980, w: 380, h: 100 },
      { x: 1330, y: 930, w: 440, h: 100 }, { x: 960, y: 640, w: 260, h: 160 }
    ],
    spawnsA: [{ x: 190, y: 210 }, { x: 230, y: 430 }, { x: 210, y: 760 }, { x: 250, y: 1090 }],
    spawnsB: [{ x: 2200, y: 220 }, { x: 2160, y: 430 }, { x: 2190, y: 760 }, { x: 2140, y: 1100 }]
  },
  'Dust Sector 9': {
    name: 'Dust Sector 9',
    obstacles: [
      { x: 330, y: 260, w: 160, h: 400 }, { x: 710, y: 230, w: 120, h: 430 },
      { x: 1060, y: 560, w: 520, h: 90 }, { x: 1620, y: 240, w: 170, h: 360 },
      { x: 430, y: 1010, w: 520, h: 90 }, { x: 1450, y: 1010, w: 470, h: 110 }
    ],
    spawnsA: [{ x: 180, y: 260 }, { x: 200, y: 520 }, { x: 220, y: 820 }, { x: 240, y: 1120 }],
    spawnsB: [{ x: 2220, y: 260 }, { x: 2200, y: 520 }, { x: 2180, y: 820 }, { x: 2160, y: 1120 }]
  },
  'Skybreak Port': {
    name: 'Skybreak Port',
    obstacles: [
      { x: 280, y: 240, w: 300, h: 120 }, { x: 720, y: 430, w: 180, h: 310 },
      { x: 1070, y: 230, w: 470, h: 90 }, { x: 960, y: 920, w: 160, h: 260 },
      { x: 1510, y: 480, w: 290, h: 130 }, { x: 1700, y: 850, w: 180, h: 290 }
    ],
    spawnsA: [{ x: 200, y: 220 }, { x: 220, y: 520 }, { x: 220, y: 860 }, { x: 240, y: 1180 }],
    spawnsB: [{ x: 2210, y: 220 }, { x: 2190, y: 520 }, { x: 2190, y: 860 }, { x: 2170, y: 1180 }]
  },
  'Obsidian Labs': {
    name: 'Obsidian Labs',
    obstacles: [
      { x: 350, y: 260, w: 190, h: 140 }, { x: 620, y: 760, w: 210, h: 130 },
      { x: 960, y: 280, w: 460, h: 90 }, { x: 1020, y: 1030, w: 360, h: 90 },
      { x: 1540, y: 540, w: 240, h: 160 }, { x: 1860, y: 860, w: 170, h: 190 }
    ],
    spawnsA: [{ x: 220, y: 240 }, { x: 230, y: 520 }, { x: 250, y: 830 }, { x: 260, y: 1140 }],
    spawnsB: [{ x: 2190, y: 240 }, { x: 2170, y: 520 }, { x: 2150, y: 830 }, { x: 2140, y: 1140 }]
  }
};

const GUNS = {
  'AK-47': { damage: 34, fireRate: 600, reloadTime: 2.8, clipSize: 30, reserve: 90, bulletSpeed: 1240, spread: 0.024 },
  'M4A1': { damage: 29, fireRate: 760, reloadTime: 2.4, clipSize: 30, reserve: 120, bulletSpeed: 1280, spread: 0.018 },
  'Vector SMG': { damage: 20, fireRate: 940, reloadTime: 2.1, clipSize: 32, reserve: 128, bulletSpeed: 1120, spread: 0.03 },
  'Rail Lance': { damage: 70, fireRate: 85, reloadTime: 3.1, clipSize: 5, reserve: 25, bulletSpeed: 1600, spread: 0.003 },
  'Breach Shotgun': { damage: 16, fireRate: 90, reloadTime: 2.9, clipSize: 8, reserve: 40, bulletSpeed: 860, spread: 0.12, pellets: 6 },
  'Pistol': { damage: 20, fireRate: 420, reloadTime: 1.45, clipSize: 12, reserve: 48, bulletSpeed: 1160, spread: 0.02 }
};

const LOADOUTS = {
  'Assault Set': { primaryGun: 'M4A1', health: 100, armor: 50, speed: 270, sprintMultiplier: 1.35, crouchMultiplier: 0.72 },
  'Stealth Set': { primaryGun: 'Vector SMG', health: 88, armor: 35, speed: 305, sprintMultiplier: 1.42, crouchMultiplier: 0.68 },
  'Heavy Set': { primaryGun: 'Breach Shotgun', health: 140, armor: 75, speed: 220, sprintMultiplier: 1.22, crouchMultiplier: 0.8 },
  'Sniper Set': { primaryGun: 'Rail Lance', health: 86, armor: 30, speed: 230, sprintMultiplier: 1.3, crouchMultiplier: 0.66 },
  'Tactical Set': { primaryGun: 'AK-47', health: 102, armor: 60, speed: 255, sprintMultiplier: 1.32, crouchMultiplier: 0.7 }
};

const SKINS = {
  'Neon Pulse': { primary: '#59d0ff', secondary: '#c8f4ff' },
  'Shadow Veil': { primary: '#7f8ba3', secondary: '#d4deea' },
  'Crimson Edge': { primary: '#ff6f8f', secondary: '#ffd0db' },
  'Arctic Camo': { primary: '#e7f4ff', secondary: '#9ec7db' },
  'Gold Standard': { primary: '#e2bf63', secondary: '#fff0b7' },
  'Digital Ghost': { primary: '#71e0cf', secondary: '#e6fff9' }
};

const VOICES = {
  default: { elim: 'eliminated', prompt: 'Holding lane.' },
  aggressive: { elim: 'deleted', prompt: 'Push now.' },
  tactical: { elim: 'secured', prompt: 'Rotate and reset.' }
};

const OPERATORS = {
  Rift: { title: 'Entry Fragger', accent: '#59d0ff' },
  Nova: { title: 'Frontline Duelist', accent: '#8af1c2' },
  Ghost: { title: 'Scout Flanker', accent: '#f7d56b' },
  Bulwark: { title: 'Anchor Tank', accent: '#ff9f79' }
};

const MODES = {
  '1v1': { playersPerTeam: 1, scoreToWin: 10, roundSeconds: 300 },
  '2v2': { playersPerTeam: 2, scoreToWin: 20, roundSeconds: 420 },
  '3v3': { playersPerTeam: 3, scoreToWin: 30, roundSeconds: 480 },
  '4v4': { playersPerTeam: 4, scoreToWin: 40, roundSeconds: 540 }
};

const mapList = Object.values(MAPS).map(map => ({
  name: map.name,
  description: ({
    'Neon Foundry': 'Split molten catwalks with a lethal center lane.',
    'Dust Sector 9': 'Wide refinery lanes with punishing flanks.',
    'Skybreak Port': 'Cargo rooftops with exposed team pushes.',
    'Obsidian Labs': 'Mirrored close-mid corridors for quick resets.'
  })[map.name] || 'Competitive arena map.'
}));

const loadoutList = Object.entries(LOADOUTS).map(([name, data]) => ({
  name,
  health: data.health,
  armor: data.armor,
  speed: data.speed,
  primaryGun: data.primaryGun
}));

const operatorList = Object.entries(OPERATORS).map(([name, data]) => ({
  name,
  title: data.title,
  accent: data.accent
}));

const gunList = Object.entries(GUNS).map(([name, data]) => ({
  name,
  damage: data.damage,
  fireRate: data.fireRate,
  reloadTime: data.reloadTime,
  clipSize: data.clipSize
}));

const skinList = Object.keys(SKINS);
const voiceList = Object.keys(VOICES);

const app = express();
app.use(cors());
app.use(express.json());

const aiCoach = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' })
  : null;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const queues = new Map(Object.keys(MODES).map(mode => [mode, []]));
const clients = new Map();
const matches = new Map();

let nextClientId = 1;
let nextMatchId = 1;

function safeSend(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function rectIntersectsCircle(rect, x, y, radius) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - closestX;
  const dy = y - closestY;
  return (dx * dx) + (dy * dy) < radius * radius;
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

function createWeaponState(name) {
  const gun = GUNS[name] || GUNS.M4A1;
  return {
    name,
    ammo: gun.clipSize,
    reserve: gun.reserve
  };
}

function buildInventory(primaryGun) {
  const chosenPrimary = primaryGun in GUNS && primaryGun !== 'Pistol' ? primaryGun : 'M4A1';
  return [createWeaponState(chosenPrimary), createWeaponState('Pistol')];
}

function getCurrentWeapon(player) {
  return player.inventory[player.currentWeaponIndex] || player.inventory[0];
}

function getWeaponConfig(player) {
  const current = getCurrentWeapon(player);
  return GUNS[current?.name] || GUNS.M4A1;
}

function applyDamage(target, amount) {
  if (target.armor > 0) {
    const absorbed = Math.min(target.armor, amount * 0.6);
    target.armor -= absorbed;
    target.health -= (amount - absorbed);
    return;
  }
  target.health -= amount;
}

function getEliminationMessage(attacker, victim, weaponName) {
  const voice = VOICES[attacker.voice] || VOICES.default;
  return `${attacker.name} ${voice.elim} ${victim.name} with ${weaponName}`;
}

function playerSnapshot(player) {
  const currentWeapon = getCurrentWeapon(player);
  const weaponConfig = getWeaponConfig(player);
  return {
    id: player.id,
    name: player.name,
    operator: player.operator,
    skin: player.skin,
    voice: player.voice,
    team: player.team,
    x: player.x,
    y: player.y,
    angle: player.angle,
    health: player.health,
    maxHealth: player.maxHealth,
    armor: player.armor,
    maxArmor: player.maxArmor,
    alive: player.alive,
    loadout: player.loadout,
    currentWeaponIndex: player.currentWeaponIndex,
    currentWeapon: {
      name: currentWeapon.name,
      ammo: currentWeapon.ammo,
      reserve: currentWeapon.reserve,
      clipSize: weaponConfig.clipSize,
      damage: weaponConfig.damage,
      fireRate: weaponConfig.fireRate,
      reloadTime: weaponConfig.reloadTime
    },
    inventory: player.inventory.map(weapon => ({
      name: weapon.name,
      ammo: weapon.ammo,
      reserve: weapon.reserve,
      clipSize: GUNS[weapon.name].clipSize
    })),
    clip: currentWeapon.ammo,
    reserve: currentWeapon.reserve,
    kills: player.kills,
    deaths: player.deaths,
    isSprinting: player.isSprinting,
    isCrouching: player.isCrouching
  };
}

function createPlayer(client, team, spawn) {
  const loadoutName = client.preferences.loadout in LOADOUTS ? client.preferences.loadout : 'Assault Set';
  const loadout = LOADOUTS[loadoutName];
  const operatorName = client.preferences.operator in OPERATORS ? client.preferences.operator : 'Nova';
  const inventory = buildInventory(client.preferences.primaryGun || loadout.primaryGun);
  return {
    id: client.id,
    client,
    name: client.name,
    operator: operatorName,
    skin: client.preferences.skin in SKINS ? client.preferences.skin : 'Neon Pulse',
    voice: client.preferences.voice in VOICES ? client.preferences.voice : 'default',
    team,
    x: spawn.x,
    y: spawn.y,
    radius: 18,
    angle: 0,
    speed: loadout.speed,
    health: loadout.health,
    maxHealth: loadout.health,
    armor: loadout.armor,
    maxArmor: loadout.armor,
    alive: true,
    loadout: loadoutName,
    inventory,
    currentWeaponIndex: 0,
    queuedWeaponIndex: 0,
    cooldown: 0,
    reloadTimer: 0,
    respawnTimer: 0,
    isSprinting: false,
    isCrouching: false,
    kills: 0,
    deaths: 0,
    input: { up: false, down: false, left: false, right: false, shoot: false, reload: false, sprint: false, crouch: false, weaponSlot: 0, angle: 0 }
  };
}

function createMatch(modeKey, clientsForMatch) {
  const mapName = clientsForMatch[0]?.preferences?.map in MAPS ? clientsForMatch[0].preferences.map : 'Neon Foundry';
  const map = MAPS[mapName];
  const settings = MODES[modeKey];
  const id = `match-${nextMatchId++}`;
  const teamA = [];
  const teamB = [];

  clientsForMatch.forEach((client, index) => {
    const team = index % 2 === 0 ? 'A' : 'B';
    const spawnList = team === 'A' ? map.spawnsA : map.spawnsB;
    const spawn = spawnList[(team === 'A' ? teamA.length : teamB.length) % spawnList.length];
    const player = createPlayer(client, team, spawn);
    client.matchId = id;
    client.playerId = player.id;
    if (team === 'A') teamA.push(player); else teamB.push(player);
  });

  const match = {
    id,
    modeKey,
    mapName,
    map,
    settings,
    bullets: [],
    scoreboard: { A: 0, B: 0 },
    players: [...teamA, ...teamB],
    createdAt: Date.now(),
    startedAt: Date.now(),
    endsAt: Date.now() + (settings.roundSeconds * 1000),
    feed: []
  };

  matches.set(id, match);
  broadcastMatchState(match, true);
}

function removeClientFromQueues(clientId) {
  for (const queue of queues.values()) {
    const index = queue.findIndex(entry => entry.id === clientId);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }
}

function maybeCreateMatch(modeKey) {
  const queue = queues.get(modeKey);
  const required = MODES[modeKey].playersPerTeam * 2;
  while (queue.length >= required) {
    const clientsForMatch = queue.splice(0, required);
    createMatch(modeKey, clientsForMatch);
  }
}

function queueClient(client, modeKey) {
  removeClientFromQueues(client.id);
  client.preferences.mode = modeKey;
  queues.get(modeKey).push(client);
  safeSend(client.socket, {
    type: 'queue-joined',
    mode: modeKey,
    current: queues.get(modeKey).length,
    needed: MODES[modeKey].playersPerTeam * 2,
    region: client.preferences.region || 'NA-East'
  });
  maybeCreateMatch(modeKey);
}

function respawnPlayer(match, player) {
  const spawnList = player.team === 'A' ? match.map.spawnsA : match.map.spawnsB;
  const spawn = spawnList[Math.floor(Math.random() * spawnList.length)];
  const loadout = LOADOUTS[player.loadout] || LOADOUTS['Assault Set'];
  const preferredPrimary = player.inventory?.[0]?.name || loadout.primaryGun;
  player.x = spawn.x;
  player.y = spawn.y;
  player.health = loadout.health;
  player.maxHealth = loadout.health;
  player.armor = loadout.armor;
  player.maxArmor = loadout.armor;
  player.inventory = buildInventory(preferredPrimary);
  player.currentWeaponIndex = 0;
  player.queuedWeaponIndex = 0;
  player.alive = true;
  player.radius = 18;
  player.isSprinting = false;
  player.isCrouching = false;
  player.respawnTimer = 0;
}

function pushFeed(match, message) {
  match.feed.unshift({ id: Date.now() + Math.random(), message });
  match.feed = match.feed.slice(0, 6);
}

function handleKill(match, attacker, victim, weaponName) {
  attacker.kills += 1;
  victim.deaths += 1;
  victim.alive = false;
  victim.respawnTimer = 3;
  match.scoreboard[attacker.team] += 1;
  pushFeed(match, getEliminationMessage(attacker, victim, weaponName));
}

function updateMatch(match, dt) {
  const now = Date.now();
  for (const player of match.players) {
    if (!player.alive) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        respawnPlayer(match, player);
      }
      continue;
    }

    const loadout = LOADOUTS[player.loadout] || LOADOUTS['Assault Set'];
    const desiredSlot = Math.max(0, Math.min((player.input.weaponSlot ?? player.currentWeaponIndex), player.inventory.length - 1));
    if (desiredSlot !== player.currentWeaponIndex && player.inventory[desiredSlot]) {
      player.currentWeaponIndex = desiredSlot;
      player.reloadTimer = 0;
    }

    const weapon = getCurrentWeapon(player);
    const weaponConfig = getWeaponConfig(player);
    const wasReloading = player.reloadTimer > 0;
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.reloadTimer = Math.max(0, player.reloadTimer - dt);

    if (wasReloading && player.reloadTimer === 0 && weapon.ammo < weaponConfig.clipSize && weapon.reserve > 0) {
      const needed = weaponConfig.clipSize - weapon.ammo;
      const amount = Math.min(needed, weapon.reserve);
      weapon.ammo += amount;
      weapon.reserve -= amount;
    }

    let moveX = 0;
    let moveY = 0;
    if (player.input.up) moveY -= 1;
    if (player.input.down) moveY += 1;
    if (player.input.left) moveX -= 1;
    if (player.input.right) moveX += 1;
    const rawMagnitude = Math.hypot(moveX, moveY);
    const magnitude = rawMagnitude || 1;
    moveX /= magnitude;
    moveY /= magnitude;

    player.isCrouching = !!player.input.crouch;
    player.isSprinting = !!player.input.sprint && !player.isCrouching && rawMagnitude > 0 && !player.input.shoot;
    player.radius = player.isCrouching ? 15 : 18;
    const moveSpeed = loadout.speed
      * (player.isSprinting ? loadout.sprintMultiplier : 1)
      * (player.isCrouching ? loadout.crouchMultiplier : 1);

    const nextX = Math.max(player.radius, Math.min(WORLD.width - player.radius, player.x + (moveX * moveSpeed * dt)));
    const nextY = Math.max(player.radius, Math.min(WORLD.height - player.radius, player.y + (moveY * moveSpeed * dt)));
    if (!match.map.obstacles.some(obstacle => rectIntersectsCircle(obstacle, nextX, player.y, player.radius))) {
      player.x = nextX;
    }
    if (!match.map.obstacles.some(obstacle => rectIntersectsCircle(obstacle, player.x, nextY, player.radius))) {
      player.y = nextY;
    }

    player.angle = player.input.angle || 0;

    if (player.input.reload && weapon.ammo < weaponConfig.clipSize && weapon.reserve > 0 && player.reloadTimer <= 0) {
      player.reloadTimer = weaponConfig.reloadTime;
    }

    if (player.input.shoot && player.cooldown <= 0 && weapon.ammo > 0 && player.reloadTimer <= 0) {
      const pellets = weaponConfig.pellets || 1;
      for (let i = 0; i < pellets; i += 1) {
        const crouchSpread = player.isCrouching ? 0.7 : 1;
        const spread = weaponConfig.spread * crouchSpread * (Math.random() - 0.5) * 4;
        const angle = player.angle + spread;
        match.bullets.push({
          id: `${player.id}-${now}-${i}`,
          owner: player.id,
          team: player.team,
          weaponName: weapon.name,
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * weaponConfig.bulletSpeed,
          vy: Math.sin(angle) * weaponConfig.bulletSpeed,
          damage: weaponConfig.damage,
          radius: 4,
          life: 1.2
        });
      }
      weapon.ammo -= 1;
      player.cooldown = 60 / weaponConfig.fireRate;
    }
  }

  for (let i = match.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = match.bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (
      bullet.life <= 0 ||
      bullet.x < 0 ||
      bullet.y < 0 ||
      bullet.x > WORLD.width ||
      bullet.y > WORLD.height ||
      match.map.obstacles.some(obstacle => rectIntersectsCircle(obstacle, bullet.x, bullet.y, bullet.radius))
    ) {
      match.bullets.splice(i, 1);
      continue;
    }

    for (const player of match.players) {
      if (!player.alive || player.team === bullet.team || player.id === bullet.owner) continue;
      const distance = Math.hypot(player.x - bullet.x, player.y - bullet.y);
      if (distance <= player.radius + bullet.radius) {
        applyDamage(player, bullet.damage);
        match.bullets.splice(i, 1);
        if (player.health <= 0) {
          const attacker = match.players.find(entry => entry.id === bullet.owner);
          if (attacker) {
            handleKill(match, attacker, player, bullet.weaponName || 'weapon');
          }
        }
        break;
      }
    }
  }

  if (match.scoreboard.A >= match.settings.scoreToWin || match.scoreboard.B >= match.settings.scoreToWin || now >= match.endsAt) {
    finishMatch(match);
  }
}

function finishMatch(match) {
  const winner = match.scoreboard.A === match.scoreboard.B
    ? 'Draw'
    : (match.scoreboard.A > match.scoreboard.B ? 'Team A' : 'Team B');

  for (const player of match.players) {
    safeSend(player.client.socket, {
      type: 'match-ended',
      winner,
      scoreboard: match.scoreboard,
      you: playerSnapshot(player)
    });
    player.client.matchId = null;
  }
  matches.delete(match.id);
}

function broadcastMatchState(match, initial = false) {
  const payload = {
    type: initial ? 'match-found' : 'state',
    matchId: match.id,
    map: match.mapName,
    mode: match.modeKey,
    world: WORLD,
    scoreToWin: match.settings.scoreToWin,
    timeLeft: Math.max(0, Math.ceil((match.endsAt - Date.now()) / 1000)),
    scoreboard: match.scoreboard,
    obstacles: match.map.obstacles,
    feed: match.feed,
    players: match.players.map(playerSnapshot),
    bullets: match.bullets.map(bullet => ({ x: bullet.x, y: bullet.y, radius: bullet.radius, team: bullet.team }))
  };

  for (const player of match.players) {
    safeSend(player.client.socket, { ...payload, selfId: player.id, team: player.team });
  }
}

setInterval(() => {
  for (const match of matches.values()) {
    updateMatch(match, 1 / TICK_RATE);
    if (matches.has(match.id)) {
      broadcastMatchState(match, false);
    }
  }
}, 1000 / TICK_RATE);

app.get('/api/multiplayer/meta', (req, res) => {
  res.json({
    modes: Object.entries(MODES).map(([key, value]) => ({
      key,
      label: key,
      playersPerTeam: value.playersPerTeam,
      scoreToWin: value.scoreToWin,
      roundSeconds: value.roundSeconds
    })),
    maps: mapList,
    loadouts: loadoutList,
    operators: operatorList,
    guns: gunList,
    skins: skinList,
    voices: voiceList
  });
});

app.post('/api/multiplayer/coach', async (req, res) => {
  const {
    mode = '1v1',
    map = 'Neon Foundry',
    loadout = 'Assault Set',
    teamScore = 0,
    enemyScore = 0,
    health = 100,
    ammo = 0
  } = req.body || {};

  const fallback = {
    advice: [
      `Play the ${map} center lane carefully and break line of sight before re-peeking.`,
      `In ${mode}, trade discipline matters more than chasing weak targets.`,
      `${loadout} works best when you reload off-angle instead of in open lane fights.`,
      health < 35 ? 'Your health is low, so break contact and re-enter from a side route.' : 'You have enough health to pressure, but only after your crosshair is set.',
      ammo < 4 ? 'Ammo is low, so reload before forcing the next duel.' : 'Use your ammo advantage to hold angle instead of wide swinging.'
    ]
  };

  if (!aiCoach) {
    res.json({ source: 'fallback', ...fallback });
    return;
  }

  try {
    const prompt = [
      'You are the Black Vortex match coach.',
      'Give exactly 4 short gameplay tips.',
      'Be concrete, competitive, and readable.',
      `Mode: ${mode}`,
      `Map: ${map}`,
      `Loadout: ${loadout}`,
      `Team score: ${teamScore}`,
      `Enemy score: ${enemyScore}`,
      `Health: ${health}`,
      `Ammo: ${ammo}`,
      'Return strict JSON: {"advice":["tip 1","tip 2","tip 3","tip 4"]}'
    ].join('\n');

    const result = await aiCoach.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(extractJsonObject(text));
    if (!Array.isArray(parsed.advice)) {
      throw new Error('Invalid AI response');
    }
    res.json({ source: 'gemini', advice: parsed.advice.slice(0, 4) });
  } catch (error) {
    res.json({ source: 'fallback', ...fallback });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, matches: matches.size, queues: Object.fromEntries([...queues.entries()].map(([mode, queue]) => [mode, queue.length])) });
});

wss.on('connection', socket => {
  const client = {
    id: `player-${nextClientId++}`,
    socket,
    name: 'Operative',
    preferences: {
      mode: '1v1',
      map: 'Neon Foundry',
      loadout: 'Assault Set',
      operator: 'Nova',
      primaryGun: 'M4A1',
      skin: 'Neon Pulse',
      voice: 'default',
      region: 'NA-East'
    },
    matchId: null,
    playerId: null
  };
  clients.set(client.id, client);
  safeSend(socket, {
    type: 'connected',
    clientId: client.id,
    modes: Object.keys(MODES),
    maps: Object.keys(MAPS),
    loadouts: Object.keys(LOADOUTS),
    operators: Object.keys(OPERATORS),
    guns: Object.keys(GUNS),
    skins: Object.keys(SKINS),
    voices: Object.keys(VOICES)
  });

  socket.on('message', raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (error) {
      return;
    }

    if (message.type === 'profile') {
      client.name = String(message.name || 'Operative').slice(0, 24);
      client.preferences.map = MAPS[message.map] ? message.map : 'Neon Foundry';
      client.preferences.loadout = LOADOUTS[message.loadout] ? message.loadout : 'Assault Set';
      client.preferences.operator = OPERATORS[message.operator] ? message.operator : 'Nova';
      client.preferences.primaryGun = GUNS[message.primaryGun] && message.primaryGun !== 'Pistol'
        ? message.primaryGun
        : LOADOUTS[client.preferences.loadout].primaryGun;
      client.preferences.skin = SKINS[message.skin] ? message.skin : 'Neon Pulse';
      client.preferences.voice = VOICES[message.voice] ? message.voice : 'default';
      client.preferences.region = String(message.region || 'NA-East').slice(0, 16);
    }

    if (message.type === 'queue') {
      const mode = message.mode in MODES ? message.mode : '1v1';
      queueClient(client, mode);
    }

    if (message.type === 'leave-queue') {
      removeClientFromQueues(client.id);
    }

    if (message.type === 'input' && client.matchId && matches.has(client.matchId)) {
      const match = matches.get(client.matchId);
      const player = match.players.find(entry => entry.id === client.playerId);
      if (player) {
        player.input = {
          up: !!message.input?.up,
          down: !!message.input?.down,
          left: !!message.input?.left,
          right: !!message.input?.right,
          shoot: !!message.input?.shoot,
          reload: !!message.input?.reload,
          sprint: !!message.input?.sprint,
          crouch: !!message.input?.crouch,
          weaponSlot: Number(message.input?.weaponSlot ?? 0),
          angle: Number(message.input?.angle || 0)
        };
      }
    }
  });

  socket.on('close', () => {
    removeClientFromQueues(client.id);
    if (client.matchId && matches.has(client.matchId)) {
      const match = matches.get(client.matchId);
      match.players = match.players.filter(player => player.id !== client.playerId);
      if (match.players.length < 2) {
        matches.delete(match.id);
      }
    }
    clients.delete(client.id);
  });
});

server.listen(PORT, () => {
  console.log(`Black Vortex multiplayer server running on http://localhost:${PORT}`);
});
