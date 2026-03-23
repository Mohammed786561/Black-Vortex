# Black Vortex - Ultimate FPS Game

A high-performance, feature-rich first-person shooter game built with vanilla JavaScript, HTML5 Canvas, and Web Audio API. This project showcases advanced game development techniques including physics, AI, particle systems, and modern web technologies.

## 🎮 Features

### Core Gameplay
- **Real-time 2D FPS combat** with smooth movement and aiming
- **Advanced weapon system** with 4 distinct weapon types (Pistol, SMG, Shotgun, Rifle)
- **Physics-based bullet mechanics** with gravity, drop, and penetration
- **Dynamic enemy AI** with different enemy types and behaviors
- **Procedural enemy spawning** with increasing difficulty waves

### Visual Effects
- **Enhanced particle system** with explosions, blood splatter, smoke, and sparks
- **Screen shake effects** for impacts and explosions
- **Animated UI elements** with floating damage text
- **Dynamic background system** with parallax scrolling and animated effects
- **Crosshair system** with weapon sway and recoil

### Audio System
- **Web Audio API synthesis** for all sound effects
- **Procedural audio generation** for weapons, impacts, explosions, and UI
- **Dynamic volume control** and audio mixing

### Game Systems
- **Progression system** with XP, levels, and weapon upgrades
- **Leaderboard system** with persistent high scores
- **Power-up system** with health, speed, damage, and ammo boosts
- **Obstacle system** with destructible and non-destructible objects
- **Wave-based progression** with increasing enemy difficulty

### Technical Features
- **No external dependencies** - pure vanilla JavaScript
- **Responsive design** that works on all screen sizes
- **Performance optimized** with efficient rendering and collision detection
- **Modular architecture** with clean separation of concerns
- **Local storage persistence** for player data and settings

### AI Authentication System
- **AI-powered security** with Google Gemini integration
- **Multi-factor authentication** with behavioral analysis
- **Google OAuth support** for seamless login
- **JWT token-based** secure authentication
- **Rate limiting** and brute force protection
- **Cloud-based progress** and leaderboard synchronization

## 🚀 Quick Start

### Option 1: Local Demo (No Server Required)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/black-vortex.git
   cd black-vortex
   ```

2. **Open in browser:**
   - Simply open `index.html` in any modern web browser
   - No build process or server required

3. **Start playing:**
   - Click "Play Now" to begin
   - Use WASD to move, mouse to aim, left click to shoot
   - Press R to reload, C to crouch, Shift to sprint

### Option 2: AI Authentication Server (Recommended)
1. **Install Dependencies**: 
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**:
   - Set `GEMINI_API_KEY` in `auth-api.js` or as environment variable
   - Set `JWT_SECRET` for secure token generation

3. **Start Server**:
   ```bash
   npm start
   # or
   node auth-api.js
   ```

4. **Play with Full Features**:
   - Open `index.html` in browser
   - Login/Register with AI-powered authentication
   - Access cloud saves, leaderboards, and progression
   - Use Google OAuth for seamless login

## 🎯 Controls

### Movement
- **W/A/S/D**: Move in 4 directions
- **Shift**: Sprint (increased speed)
- **C**: Crouch (reduced speed, smaller hitbox)

### Combat
- **Mouse**: Aim and look around
- **Left Click**: Shoot
- **Right Click**: Aim down sights (ADS)
- **R**: Reload weapon

### Weapon Selection
- **1**: Pistol
- **2**: SMG
- **3**: Shotgun
- **4**: Rifle

## 🏗️ Architecture

### Core Classes

#### Game Engine
- `Game`: Main game loop and state management
- `Player`: Player character with movement, combat, and stats
- `Enemy`: AI enemies with different behaviors and types
- `Bullet`: Projectile physics and collision
- `Particle`: Visual effects system

#### Systems
- `AudioSystem`: Web Audio API sound generation
- `ParticleSystem`: Enhanced particle effects
- `Leaderboard`: High score tracking
- `ProgressionSystem`: XP and level progression
- `PowerUp`: Collectible items system

#### UI Components
- **Authentication System**: Login/register with local storage
- **Dashboard**: Main game interface with stats
- **Loadout System**: Weapon and equipment selection
- **Matchmaking**: Queue system simulation

## 🎨 Visual Features

### Particle Effects
- **Explosions**: Multi-colored particle bursts
- **Blood Splatter**: Directional blood effects
- **Smoke**: Rising smoke particles
- **Sparks**: Metal impact effects
- **Trails**: Bullet and projectile trails

### Background System
- **Parallax scrolling** stars and buildings
- **Animated gradient sky** with time-based color shifts
- **Procedural cityscape** with animated windows
- **Atmospheric effects** and lens flares

### UI Animations
- **Floating text** for damage and effects
- **Health bar** with smooth animations
- **Crosshair** with weapon sway
- **Hit markers** for successful shots

## 🔊 Audio Features

### Sound Categories
- **Weapons**: Shoot, reload, empty click sounds
- **Impacts**: Bullet hits, explosions, blood splatter
- **UI**: Menu clicks, level up, power-up collection
- **Environment**: Background ambiance and effects

### Audio Technology
- **Procedural synthesis** using Web Audio API
- **Oscillator-based** sound generation
- **Envelope shaping** for realistic sounds
- **Dynamic mixing** and volume control

## 📊 Game Systems

### Progression
- **Level system** with XP accumulation
- **Weapon leveling** with unlockable weapons
- **Achievement tracking** for various milestones
- **Persistent stats** across game sessions

### Combat
- **Weapon variety** with different stats and behaviors
- **Ammo management** with reload mechanics
- **Damage system** with different damage types
- **Recoil and spread** for realistic shooting

### AI
- **Multiple enemy types** with different behaviors
- **Pathfinding** around obstacles
- **Line of sight** detection
- **Attack patterns** and cooldowns

## 🛠️ Development

### Project Structure
```
black-vortex/
├── index.html          # Main HTML file
├── css/
│   ├── style.css       # Main styles
│   └── simple.css      # Simple mode styles
├── js/
│   └── app.js          # Game logic and systems
├── assets/
│   └── icons/          # Weapon icons
├── server/             # Optional Node.js backend
└── README.md           # This file
```

### Technologies Used
- **HTML5 Canvas**: 2D rendering engine
- **Web Audio API**: Sound generation and mixing
- **Vanilla JavaScript**: No frameworks or libraries
- **CSS3**: Modern styling and animations
- **LocalStorage**: Data persistence

### Browser Support
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Touch controls supported

## 🎮 Game Modes

### Free For All
- **Solo combat** against waves of enemies
- **Progressive difficulty** with increasing enemy numbers
- **Score-based** progression system

### Coming Features (Planned)
- **Multiplayer support** with WebSocket integration
- **Team-based modes** (TDM, CTF)
- **Custom maps** and environments
- **Advanced loadout system**

## 📈 Performance

### Optimizations
- **Efficient collision detection** using spatial partitioning
- **Object pooling** for bullets and particles
- **Canvas optimization** with dirty rectangle rendering
- **Memory management** with proper cleanup

### Performance Metrics
- **60 FPS** target on modern devices
- **< 50MB** memory usage
- **Instant load** times
- **Smooth gameplay** even with many particles

## 🔧 Customization

### Adding Weapons
```javascript
// In the Player class updateWeaponStats method
case 'new-weapon':
  this.weapon.damage = 50;
  this.weapon.fireRate = 500;
  // ... other stats
  break;
```

### Adding Enemy Types
```javascript
// In the Enemy class determineType method
if (wave >= 10 && roll > 0.8) return 'boss';
```

### Customizing Particles
```javascript
// In the ParticleSystem class
createCustomEffect(x, y, count) {
  // Custom particle logic
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Web Audio API** for amazing sound synthesis capabilities
- **HTML5 Canvas** for powerful 2D rendering
- **Modern browsers** for excellent JavaScript performance
- **Game development community** for inspiration and techniques

## 📊 Admin Dashboard & Monitoring

### Quick Start Monitoring
```bash
cd server
npm run dashboard
```
This will:
- Start the authentication server
- Launch the log monitor
- Open the real-time dashboard in your browser

### Manual Monitoring Setup
```bash
# Terminal 1: Start authentication server
cd server
npm start

# Terminal 2: Start log monitor
cd server
npm run monitor

# Terminal 3: View dashboard
cd server
start dashboard.html
```

### One-Click Monitoring (Windows)
```bash
cd server
start start-monitoring.bat
```

### Dashboard Features
- **Real-time statistics**: Login attempts, success rates, user activity
- **Security monitoring**: Failed login attempts, suspicious activity
- **Activity logs**: Detailed event logging with timestamps
- **Live updates**: Auto-refreshing every 30 seconds
- **Security indicators**: Visual alerts for potential threats

### Log Files
- **Security logs**: `server/logs/security.log` - Failed attempts and security events
- **Activity logs**: `server/logs/activity.log` - Successful logins and registrations

## 📞 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Check the browser console for errors
- Ensure you're using a modern browser with Web Audio API support

---

**Black Vortex** - Experience the ultimate browser-based FPS adventure!
