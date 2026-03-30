# Black Vortex

Black Vortex is now organized around a clearer game flow:

1. Open `index.html`
2. Pick `1v1`, `2v2`, `3v3`, or `4v4`
3. Choose a map and loadout
4. Join the online client in `online-match.html`

If you want a local warm-up instead, the launcher still offers offline practice through `ultimate-black-vortex-fps.html`.

## Main Files

- `index.html`
  Main match hub and launcher.

- `online-match.html`
  Online multiplayer client with HUD, feed, health, ammo, and AI coach tips.

- `ultimate-black-vortex-fps.html`
  Offline practice build.

- `server/multiplayer-server.js`
  Real-time multiplayer service with queue matchmaking, team matches, combat state, and coach API.

## Current Online Features

- Queue sizes: `1v1`, `2v2`, `3v3`, `4v4`
- Team-based matchmaking by requested queue size
- Original Black Vortex maps
- Operator, skin, voice, and primary weapon customization from the launcher
- Multiple loadouts with different health, armor, speed, sprint, and crouch handling
- Weapon inventory with primary + sidearm switching
- Real-time movement, aiming, shooting, reloads, bullets, respawns, armor, and score tracking
- Local profile progression and recent match history
- AI coach endpoint for short in-match gameplay tips

## Controls

- `WASD`: move
- `Shift`: sprint
- `Ctrl` or `C`: crouch
- `Mouse`: aim
- `Left Click`: fire
- `R`: reload
- `1` / `2`: switch weapons

## Quick Start

### Option 1: One-Click Start (Windows)
Double-click `START_GAME.bat` to automatically:
- Check for Node.js
- Install dependencies if needed
- Start both servers

### Option 2: Manual Start
From the `server` folder:

```bash
npm install
npm start
```

This starts both the authentication server (port 4000) and multiplayer server (port 4010).

### Option 3: Start Servers Separately
```bash
# Terminal 1 - Auth Server
npm run auth

# Terminal 2 - Multiplayer Server
npm run multiplayer
```

## Server Endpoints

Once running, verify servers are working:

- **Auth Server**: http://localhost:4000
- **Multiplayer Server**: http://localhost:4010
- **Health Check**: http://localhost:4010/health
- **Multiplayer API**: http://localhost:4010/api/multiplayer/meta

## AI Coach

The multiplayer server exposes:

```text
POST /api/multiplayer/coach
```

If `GEMINI_API_KEY` is configured, it will try to generate short match tips with Gemini. If not, it falls back to built-in coaching advice so the game still works.

## Notes

- The old admin pages are separate and were left in place.
- The older prototype pages are no longer the main way to enter the game.
- This environment did not provide a live browser or working Node runtime for full end-to-end playtesting, so the current pass was verified by code review and integration work rather than a full multiplayer session.
