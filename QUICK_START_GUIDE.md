# Black Vortex - Quick Start Guide

## 🚀 Complete Setup in 5 Minutes

This guide will get you up and running with the fully enhanced Black Vortex game with 4K graphics, multiplayer, and all improvements.

## 📋 Prerequisites

- **Node.js** (version 16.0.0 or higher)
- **npm** (version 8.0.0 or higher)
- **Modern Browser** (Chrome, Firefox, Edge with WebGL support)

## 🛠️ Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start Servers

**Option A: One-Click Start (Recommended for Windows)**
Simply double-click `START_GAME.bat` in the root directory. This will:
- Check for Node.js installation
- Install dependencies if needed
- Start both authentication and multiplayer servers

**Option B: Manual Start**
```bash
# Start both servers at once
cd server
npm start
```

**Option C: Start Servers Separately**
```bash
# Terminal 1 - Authentication Server (Port 4000)
cd server
npm run auth

# Terminal 2 - Multiplayer Server (Port 4010)
cd server
npm run multiplayer
```

**Option D: Use Batch Files**
```bash
# Start authentication server
start-auth.bat

# Start multiplayer server  
start-multiplayer.bat
```

### 3. Launch Game
Open any of these HTML files in your browser:

- **Main Launcher**: `index.html` - Match hub with online/offline options
- **Multiplayer Client**: `online-match.html` - Full multiplayer experience
- **Practice Mode**: `ultimate-black-vortex-fps.html` - Offline practice
- **Enhanced Launcher**: `index-improved.html` - Modern UI with server status

## 🎮 Game Modes

### Single Player (Practice)
- **File**: `game-engine-4k.html`
- **Features**: 
  - 4K Three.js rendering
  - Physics engine (Cannon-es)
  - Obstacle collision
  - Weapon switching
  - Mobile controls

### Multiplayer Online
- **File**: `multiplayer-client.html`
- **Features**:
  - Real-time matchmaking
  - Team-based FPS
  - Player synchronization
  - Live score tracking
  - Match feed and notifications

### Enhanced Launcher
- **File**: `index-improved.html`
- **Features**:
  - Server status monitoring
  - Profile management
  - Match configuration
  - Queue system

## 🎯 Controls

### Keyboard (Desktop)
- **WASD**: Move
- **Mouse**: Aim
- **Left Click**: Shoot
- **R**: Reload
- **Shift**: Sprint
- **C**: Crouch
- **1/2**: Switch Weapon

### Touch (Mobile)
- **Left Joystick**: Move
- **Right Button**: Shoot
- **Swipe**: Aim
- **Tap**: Interact

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Launcher      │    │   Authentication │    │   Multiplayer   │
│ index-improved  │───▶│   Server         │───▶│   Server        │
│                 │    │   (Port 4000)    │    │   (Port 4010)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Game Client   │
│ multiplayer-    │
│ client.html     │
└─────────────────┘
```

## 🔧 Server Configuration

### Environment Variables
Create a `.env` file in the `server` directory:
```bash
# Server Configuration
NODE_ENV=development
MULTIPLAYER_PORT=4010

# AI Coach (Optional)
GEMINI_API_KEY=your-gemini-api-key-here

# Security
JWT_SECRET=your-jwt-secret-key-here
```

### Server Endpoints

#### Authentication Server (Port 4000)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /health` - Server health check

#### Multiplayer Server (Port 4010)
- `GET /health` - Server health check
- `GET /api/multiplayer/meta` - Game metadata
- `POST /api/multiplayer/coach` - AI coach tips
- `WebSocket /` - Real-time game communication

## 🎨 Game Features

### Enhanced Graphics
- **4K Rendering**: High-resolution Three.js graphics
- **Post Processing**: Bloom, tone mapping, shadows
- **Lighting**: Dynamic lighting with shadows
- **Physics**: Realistic collision and movement

### Multiplayer System
- **Matchmaking**: Queue-based team balancing
- **Real-time Sync**: 60 FPS updates
- **Voice Chat**: Operator voice lines
- **Match History**: Persistent player stats

### Progression System
- **Leveling**: XP-based progression
- **Ranks**: Rookie to Master system
- **Currency**: In-game credits
- **Achievements**: Unlockable content

## 🐛 Troubleshooting

### Quick Fixes for Common Issues

#### "Server Offline" or "Could not connect to ws://localhost:4010"
**This is the most common issue!**

**Solution:**
1. Make sure the servers are running:
   ```bash
   cd server
   npm start
   ```
2. You should see: "🚀 Black Vortex multiplayer server running on http://localhost:4010"
3. Verify at: http://localhost:4010/health

#### "Game won't start or load"
**Solution:**
1. For **Practice Mode**: Just open `ultimate-black-vortex-fps.html` - no server needed!
2. For **Multiplayer**: Start servers first, then open `index.html`
3. Check browser console (F12) for errors

#### "Multiplayer not working"
**Solution:**
1. Start both servers: `cd server && npm start`
2. Wait for "Servers started successfully" message
3. Open `index.html` and click "Join Online Match"
4. Need 2+ players for matchmaking

#### "Dependencies not installing"
```bash
cd server
rm -rf node_modules
npm cache clean --force
npm install
```

#### "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :4000
netstat -ano | findstr :4010

# Kill the process if needed
taskkill /PID <process-id> /F
```

#### "Cannot find module"
```bash
# Reinstall dependencies
cd server
npm install --force
```

#### "Connection refused"
1. Ensure both servers are running
2. Check firewall settings
3. Verify ports 4000 and 4010 are not blocked
4. Check server logs in `server/logs/`

#### "WebGL not supported"
- Update your browser
- Enable WebGL in browser settings
- Use Chrome/Firefox/Edge (Safari has limited WebGL support)

### Recent Fixes Applied ✅

The following issues have been fixed:

1. **Missing start-server.js** - Created new server launcher
2. **Wrong package.json scripts** - Updated to use correct files
3. **Server connection issues** - Fixed WebSocket connection
4. **Dependency problems** - Added automatic installation
5. **Multiplayer not starting** - Fixed server startup sequence

**If you still have issues after these fixes:**
1. Delete `server/node_modules` folder
2. Run `cd server && npm install`
3. Run `cd server && npm start`
4. Check the terminal for error messages

### Server Logs
- **Authentication logs**: `server/logs/server.log`
- **Multiplayer logs**: `server/logs/multiplayer.log`
- **Setup logs**: `server/logs/setup.log`

### Health Checks
```bash
# Check authentication server
curl http://localhost:4000/health

# Check multiplayer server  
curl http://localhost:4010/health
```

## 🚀 Advanced Usage

### Custom Maps
1. Edit `MAPS` object in `server/multiplayer-server-improved.js`
2. Add new map with obstacles and spawn points
3. Restart multiplayer server

### New Weapons
1. Edit `GUNS` object in `server/multiplayer-server-improved.js`
2. Define damage, fire rate, reload time
3. Restart servers

### Custom Loadouts
1. Edit `LOADOUTS` object in `server/multiplayer-server-improved.js`
2. Configure health, speed, weapons
3. Restart servers

### AI Coach
1. Set `GEMINI_API_KEY` in environment variables
2. AI will provide tactical tips during matches
3. Fallback to static tips if API unavailable

## 📊 Performance Tips

### For Better Performance
- Lower `renderer.setPixelRatio()` to 1.5 or 1.0
- Reduce shadow map size in `setupLighting()`
- Limit particle effects
- Use simpler textures

### For Maximum Quality
- Set `renderer.setPixelRatio(2)` for 4K
- Enable all post-processing effects
- Use high-resolution textures
- Enable MSAA anti-aliasing

## 🔒 Security Notes

- **JWT Tokens**: 24-hour expiration with secure signing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All user inputs are sanitized
- **Password Hashing**: bcrypt with 12 rounds
- **CORS**: Proper cross-origin policy configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: README.md and IMPROVEMENTS.md
- **Setup Guide**: SETUP_GUIDE.md
- **Quick Start**: This file

---

**Enjoy the game! 🎮**

For the best experience, use a modern browser with WebGL support and ensure both servers are running before launching the game.