let selectedLoadout = "";
let selectedMap = "";
const API_BASE = 'http://localhost:4001/api/simple';

// Initialize the simple demo
document.addEventListener('DOMContentLoaded', () => {
  loadLoadouts();
  loadMaps();
});

function showSection(section) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.add("hidden");
  });
  document.getElementById(section).classList.remove("hidden");
}

async function loadLoadouts() {
  try {
    const response = await fetch(`${API_BASE}/loadouts`);
    const loadouts = await response.json();
    
    const container = document.querySelector('.container');
    const loadoutSection = document.getElementById('loadout');
    
    // Clear existing loadout cards
    const existingCards = loadoutSection.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // Create new loadout cards from API
    loadouts.forEach(loadout => {
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => selectLoadout(loadout.name);
      card.innerHTML = `
        <h3>${loadout.name}</h3>
        <p>${loadout.weapons.join(' + ')}</p>
        <small>${loadout.description}</small>
      `;
      loadoutSection.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load loadouts:', error);
  }
}

async function loadMaps() {
  try {
    const response = await fetch(`${API_BASE}/maps`);
    const maps = await response.json();
    
    const mapSection = document.getElementById('maps');
    
    // Clear existing map cards
    const existingCards = mapSection.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // Create new map cards from API
    maps.forEach(map => {
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => selectMap(map.name);
      card.innerHTML = `
        <h3>${map.name}</h3>
        <small>${map.description}</small>
      `;
      mapSection.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load maps:', error);
  }
}

function selectLoadout(loadout) {
  selectedLoadout = loadout;
  document.getElementById("selectedLoadout").innerText =
    "Selected: " + loadout;
}

function selectMap(map) {
  selectedMap = map;
  document.getElementById("selectedMap").innerText =
    "Selected: " + map;
}

async function startGame() {
  if (!selectedLoadout || !selectedMap) {
    document.getElementById("gameStatus").innerText =
      "Select loadout and map first!";
    return;
  }

  document.getElementById("gameStatus").innerText =
    "Loading match...";

  try {
    const response = await fetch(`${API_BASE}/start-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        loadout: selectedLoadout,
        map: selectedMap
      })
    });

    const result = await response.json();
    
    if (result.success) {
      document.getElementById("gameStatus").innerText =
        result.message;
      
      // Simulate game completion after 3 seconds
      setTimeout(() => {
        completeGame(result.session.sessionId);
      }, 3000);
    } else {
      document.getElementById("gameStatus").innerText =
        "Failed to start match: " + result.message;
    }
  } catch (error) {
    document.getElementById("gameStatus").innerText =
      "Network error: " + error.message;
  }
}

async function completeGame(sessionId) {
  // Generate random score and stats
  const score = Math.floor(Math.random() * 1000) + 100;
  const kills = Math.floor(Math.random() * 20) + 1;
  const deaths = Math.floor(Math.random() * 10) + 1;

  try {
    const response = await fetch(`${API_BASE}/save-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: sessionId,
        score: score,
        kills: kills,
        deaths: deaths
      })
    });

    const result = await response.json();
    
    if (result.success) {
      document.getElementById("gameStatus").innerText =
        `Match completed! Score: ${score}, K/D: ${kills}/${deaths}`;
    } else {
      document.getElementById("gameStatus").innerText =
        "Failed to save score: " + result.message;
    }
  } catch (error) {
    document.getElementById("gameStatus").innerText =
      "Failed to save score: " + error.message;
  }
}
