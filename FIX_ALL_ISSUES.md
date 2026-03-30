# Black Vortex - Complete Fix Guide

## Issues Identified and Fixed

### 1. **Server Connection Issues** ✅ FIXED
- **Problem**: The game tries to connect to `ws://localhost:4010` but the server wasn't running
- **Solution**: Created `server/start-server.js` to properly launch both servers

### 2. **Missing Start Script** ✅ FIXED
- **Problem**: `package.json` referenced `start-server.js` which didn't exist
- **Solution**: Created the missing `start-server.js` file

### 3. **Dependency Issues** ✅ FIXED
- **Problem**: Server dependencies weren't installed
- **Solution**: The new start script automatically installs dependencies if missing

### 4. **Multiplayer Not Working** ✅ FIXED
- **Problem**: Multiplayer server wasn't starting correctly
- **Solution**: Updated scripts to use `multiplayer-server-improved.js`

---

## Quick Start Guide

### Option 1: One-Command Start (Recommended)

**Windows:**
```bash
cd server
npm install
npm start
```

**Or use the batch file:**
```bash
start-multiplayer.bat
```

### Option 2: Manual Start

**Step 1: Install Dependencies**
```bash
cd server
npm install
```

**Step 2: Start Authentication Server**
```bash
npm run auth
```

**Step 3: Start Multiplayer Server (in a new terminal)**
```bash
npm run multiplayer
```

### Option 3: Development Mode

```bash
cd server
npm run dev
```

---

## How to Play

### Practice Mode (Offline)
1. Open `index.html` in your browser
2. Click "Practice Offline"
3. Game loads immediately - no server needed!

### Multiplayer Mode (Online)
1. Start the servers using one of the methods above
2. Open `index.html` in your browser
3. Configure your player name, loadout, and map
4. Click "Join Online Match"
5. Wait for matchmaking (need 2-8 players depending on mode)

---

## Server Endpoints

Once servers are running, you can verify:

- **Auth Server**: http://localhost:4000
- **Multiplayer Server**: http://localhost:4010
- **Health Check**: http://localhost:4010/health
- **API**: http://localhost:4010/api/multiplayer

---

## Troubleshooting

### "Server Offline" Error
**Cause**: Multiplayer server not running
**Fix**: 
```bash
cd server
npm start
```

### "Could not connect to ws://localhost:4010"
**Cause**: WebSocket server not started
**Fix**: Make sure you see "🚀 Black Vortex multiplayer server running" in the terminal

### Dependencies Not Installing
**Fix**:
```bash
cd server
rm -rf node_modules
npm cache clean --force
npm install
```

### Port Already in Use
**Fix**: Change ports in environment variables:
```bash
set PORT=4001
set MULTIPLAYER_PORT=4011
npm start
```

### Game Won't Load
**Fix**: 
1. Check browser console for errors (F12)
2. Make sure you're opening `index.html` from a web server or file
3. Try a different browser (Chrome recommended)

---

## File Structure

```
Black Vortex/
├── index.html                 # Main game launcher
├── online-match.html          # Multiplayer game client
├── ultimate-black-vortex-fps.html  # Practice mode game
├── server/
│   ├── start-server.js        # NEW: Server launcher
│   ├── auth-api.js            # Authentication server
│   ├── multiplayer-server-improved.js  # Multiplayer server
│   ├── package.json           # Updated with correct scripts
│   └── ...
└── FIX_ALL_ISSUES.md          # This file
```

---

## Game Features

### Modes
- **1v1 Duel**: Fast-paced 1v1 combat
- **2v2 Strike**: Team-based 2v2 matches
- **3v3 Squad**: Mid-size team battles
- **4v4 Clash**: Full arena chaos

### Maps
- **Neon Foundry**: Molten core lanes with split catwalks
- **Dust Sector 9**: Wide desert refinery with long sightlines
- **Skybreak Port**: Rooftop cargo with vertical pressure
- **Obsidian Labs**: Close-mid corridors with mirrored entries

### Loadouts
- **Assault Set**: Balanced rifle handling (M4A1)
- **Stealth Set**: Fast movement (Vector SMG)
- **Heavy Set**: Tank with shotgun (Breach Shotgun)
- **Sniper Set**: Long-range precision (Rail Lance)
- **Tactical Set**: Sharp precision (AK-47)

### Operators
- **Rift**: Aggressive entry fragger
- **Nova**: Balanced frontline duelist
- **Ghost**: Light-footed scout
- **Bulwark**: Heavy tactical anchor

---

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Aim |
| Left Click | Shoot |
| R | Reload |
| Shift | Sprint |
| Ctrl/C | Crouch |
| 1/2 | Switch weapons |
| Space | Dash (practice mode) |
| P | Pause (practice mode) |

---

## Support

If you're still having issues:

1. Check the browser console (F12) for error messages
2. Check the server terminal for error messages
3. Make sure Node.js is installed (`node --version`)
4. Make sure you're in the correct directory
5. Try restarting everything

---

## Recent Fixes Applied

- ✅ Created missing `start-server.js`
- ✅ Updated `package.json` with correct scripts
- ✅ Fixed server startup sequence
- ✅ Added automatic dependency installation
- ✅ Improved error handling and logging
- ✅ Added health check endpoints
- ✅ Fixed WebSocket connection issues

**All issues should now be resolved!** 🎮