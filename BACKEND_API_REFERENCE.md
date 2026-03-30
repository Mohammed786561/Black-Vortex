# Black Vortex Backend API Reference

## Overview

Complete backend system with authentication, user management, multiplayer game servers, and AI-powered features.

---

## 🔐 Authentication Server (`server/auth-api.js`)

**Port**: 4000 (default)
**Base URL**: `http://localhost:4000`

### Authentication Endpoints

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "Username",
    "email": "user@example.com",
    "level": 5,
    "xp": 2500,
    "credits": 150
  },
  "aiAnalysis": {
    "isValid": true,
    "isSuspicious": false,
    "securityScore": 8
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

#### POST `/api/auth/register`
Create new account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "PlayerName"
}
```

**Validation:**
- Email must be valid format
- Password minimum 6 characters
- Name 2-24 characters
- Email must be unique

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Welcome to Black Vortex!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-456",
    "name": "PlayerName",
    "email": "newuser@example.com",
    "level": 1,
    "xp": 0,
    "credits": 0
  }
}
```

---

#### POST `/api/auth/google`
Google OAuth login (simulated).

**Request:**
```json
{
  "email": "user@gmail.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google OAuth successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "user",
    "email": "user@gmail.com",
    "level": 1,
    "xp": 0
  },
  "verification": {
    "googleVerified": true,
    "emailValid": true,
    "accountExists": true
  }
}
```

---

#### POST `/api/auth/logout`
Logout and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### GET `/api/auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-123",
  "name": "Username",
  "email": "user@example.com",
  "level": 5,
  "xp": 2500,
  "credits": 150,
  "totalKills": 150,
  "totalDeaths": 75,
  "totalMatches": 50,
  "totalWins": 30,
  "bestScore": 1500,
  "bestStreak": 8,
  "favoriteOperator": "Nova",
  "favoriteLoadout": "Assault Set",
  "isOnline": true,
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### POST `/api/user/progress`
Update player stats after match.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "kills": 5,
  "deaths": 2,
  "score": 1000,
  "matchResult": "win",
  "operator": "Nova",
  "loadout": "Assault Set",
  "weapon": "M4A1",
  "map": "Neon Foundry",
  "mode": "1v1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress saved.",
  "user": {
    "name": "Username",
    "level": 6,
    "xp": 2650,
    "credits": 175,
    "totalKills": 155,
    "totalDeaths": 77,
    "totalMatches": 51,
    "totalWins": 31
  },
  "earned": {
    "xp": 150,
    "credits": 25
  },
  "leveledUp": true
}
```

---

#### GET `/api/user/matches`
Get match history.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of matches to return (default: 10)

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "matchId": "match-1234567890",
      "mode": "1v1",
      "map": "Neon Foundry",
      "result": "win",
      "score": 1000,
      "kills": 5,
      "deaths": 2,
      "operator": "Nova",
      "loadout": "Assault Set",
      "weapon": "M4A1",
      "xpEarned": 150,
      "creditsEarned": 25,
      "playedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Social Endpoints

#### GET `/api/friends`
Get friends list.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "friends": [
    {
      "id": "user-789",
      "name": "FriendName",
      "level": 10,
      "isOnline": true,
      "lastLogin": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/friends/add`
Send friend request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "targetEmail": "friend@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend request sent to FriendName"
}
```

---

#### DELETE `/api/friends/:friendId`
Remove friend.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Friend removed"
}
```

---

#### GET `/api/users/online`
Get list of online users.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-123",
      "name": "OnlinePlayer",
      "level": 8
    }
  ]
}
```

---

### Leaderboard

#### GET `/api/leaderboard`
Get top players.

**Query Parameters:**
- `limit` (optional): Number of players (default: 10)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "name": "TopPlayer",
      "level": 25,
      "xp": 50000,
      "totalKills": 500,
      "totalDeaths": 100,
      "kdRatio": "5.00"
    }
  ]
}
```

---

## 🎮 Multiplayer Server (`server/multiplayer-server-improved.js`)

**Port**: 4010 (default)
**WebSocket**: `ws://localhost:4010`
**HTTP Base URL**: `http://localhost:4010`

### HTTP Endpoints

#### GET `/health`
Server health check.

**Response:**
```json
{
  "ok": true,
  "matches": 2,
  "queues": {
    "1v1": 3,
    "2v2": 0,
    "3v3": 0,
    "4v4": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### GET `/api/multiplayer/meta`
Get game metadata.

**Response:**
```json
{
  "modes": [
    {
      "key": "1v1",
      "label": "1v1",
      "playersPerTeam": 1,
      "scoreToWin": 10,
      "roundSeconds": 300
    }
  ],
  "maps": [
    {
      "name": "Neon Foundry",
      "description": "Split molten catwalks with a lethal center lane."
    }
  ],
  "loadouts": [
    {
      "name": "Assault Set",
      "health": 100,
      "armor": 50,
      "speed": 270,
      "primaryGun": "M4A1"
    }
  ],
  "operators": [
    {
      "name": "Nova",
      "title": "Frontline Duelist",
      "accent": "#8af1c2"
    }
  ],
  "guns": [
    {
      "name": "M4A1",
      "damage": 29,
      "fireRate": 760,
      "reloadTime": 2.4,
      "clipSize": 30
    }
  ],
  "skins": ["Neon Pulse", "Shadow Veil", "Crimson Edge"],
  "voices": ["default", "aggressive", "tactical"]
}
```

---

#### POST `/api/multiplayer/coach`
Get AI coaching tips.

**Request:**
```json
{
  "mode": "1v1",
  "map": "Neon Foundry",
  "loadout": "Assault Set",
  "teamScore": 5,
  "enemyScore": 3,
  "health": 75,
  "ammo": 12
}
```

**Response:**
```json
{
  "source": "gemini",
  "advice": [
    "Play the Neon Foundry center lane carefully and break line of sight before re-peeking.",
    "In 1v1, trade discipline matters more than chasing weak targets.",
    "Assault Set works best when you reload off-angle instead of in open lane fights.",
    "You have enough health to pressure, but only after your crosshair is set."
  ]
}
```

---

### WebSocket Events

#### Client → Server

**`profile`** - Send player preferences
```json
{
  "type": "profile",
  "name": "PlayerName",
  "map": "Neon Foundry",
  "loadout": "Assault Set",
  "operator": "Nova",
  "primaryGun": "M4A1",
  "skin": "Neon Pulse",
  "voice": "default",
  "region": "NA-East"
}
```

**`queue`** - Join matchmaking
```json
{
  "type": "queue",
  "mode": "1v1"
}
```

**`input`** - Send player inputs (30 times/sec)
```json
{
  "type": "input",
  "input": {
    "up": true,
    "down": false,
    "left": false,
    "right": true,
    "shoot": true,
    "reload": false,
    "sprint": false,
    "crouch": false,
    "weaponSlot": 0,
    "angle": 1.57
  }
}
```

**`leave-queue`** - Leave matchmaking
```json
{
  "type": "leave-queue"
}
```

---

#### Server → Client

**`connected`** - Connection confirmed
```json
{
  "type": "connected",
  "clientId": "player-1",
  "modes": ["1v1", "2v2", "3v3", "4v4"],
  "maps": ["Neon Foundry", "Dust Sector 9"],
  "loadouts": ["Assault Set", "Stealth Set"],
  "operators": ["Rift", "Nova", "Ghost", "Bulwark"],
  "guns": ["AK-47", "M4A1", "Vector SMG"],
  "skins": ["Neon Pulse", "Shadow Veil"],
  "voices": ["default", "aggressive", "tactical"]
}
```

**`queue-joined`** - Queue status update
```json
{
  "type": "queue-joined",
  "mode": "1v1",
  "current": 1,
  "needed": 2,
  "region": "NA-East"
}
```

**`match-found`** - Match starting
```json
{
  "type": "match-found",
  "matchId": "match-1",
  "map": "Neon Foundry",
  "mode": "1v1",
  "selfId": "player-1",
  "team": "A",
  "world": { "width": 2400, "height": 1500 },
  "players": [...],
  "bullets": [],
  "obstacles": [...],
  "feed": [],
  "scoreboard": { "A": 0, "B": 0 },
  "timeLeft": 300
}
```

**`state`** - Game state update (20 times/sec)
```json
{
  "type": "state",
  "matchId": "match-1",
  "map": "Neon Foundry",
  "mode": "1v1",
  "selfId": "player-1",
  "team": "A",
  "world": { "width": 2400, "height": 1500 },
  "scoreToWin": 10,
  "timeLeft": 295,
  "scoreboard": { "A": 2, "B": 1 },
  "obstacles": [...],
  "feed": [
    { "message": "Nova eliminated Rift with M4A1" }
  ],
  "players": [
    {
      "id": "player-1",
      "name": "PlayerName",
      "operator": "Nova",
      "skin": "Neon Pulse",
      "team": "A",
      "x": 500,
      "y": 300,
      "angle": 0,
      "health": 100,
      "maxHealth": 100,
      "armor": 50,
      "maxArmor": 50,
      "alive": true,
      "loadout": "Assault Set",
      "currentWeapon": {
        "name": "M4A1",
        "ammo": 28,
        "reserve": 90,
        "clipSize": 30,
        "damage": 29,
        "fireRate": 760,
        "reloadTime": 2.4
      },
      "kills": 2,
      "deaths": 1,
      "isSprinting": false,
      "isCrouching": false
    }
  ],
  "bullets": [
    { "x": 520, "y": 310, "radius": 4, "team": "A" }
  ]
}
```

**`match-ended`** - Match finished
```json
{
  "type": "match-ended",
  "winner": "Team A",
  "scoreboard": { "A": 10, "B": 7 },
  "you": {
    "id": "player-1",
    "name": "PlayerName",
    "kills": 8,
    "deaths": 3,
    "health": 100,
    "armor": 50
  }
}
```

---

## 🗄️ Database Schema (`server/database.js`)

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required, 2-24 chars),
  level: Number (default: 1),
  xp: Number (default: 0),
  credits: Number (default: 0),
  totalKills: Number (default: 0),
  totalDeaths: Number (default: 0),
  totalMatches: Number (default: 0),
  totalWins: Number (default: 0),
  bestScore: Number (default: 0),
  bestStreak: Number (default: 0),
  favoriteOperator: String (default: 'Nova'),
  favoriteLoadout: String (default: 'Assault Set'),
  favoriteMap: String (default: 'Neon Foundry'),
  friends: [ObjectId],
  friendRequests: [{
    from: ObjectId,
    createdAt: Date
  }],
  isOnline: Boolean (default: false),
  lastLogin: Date,
  createdAt: Date,
  isAdmin: Boolean (default: false)
}
```

### MatchHistory Collection
```javascript
{
  _id: ObjectId,
  playerId: ObjectId (ref: User),
  matchId: String (required),
  mode: String (enum: ['1v1', '2v2', '3v3', '4v4']),
  map: String (required),
  result: String (enum: ['win', 'loss', 'draw']),
  score: Number,
  kills: Number,
  deaths: Number,
  assists: Number,
  damage: Number,
  xpEarned: Number,
  creditsEarned: Number,
  operator: String,
  loadout: String,
  weapon: String,
  duration: Number,
  playedAt: Date
}
```

### Session Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  token: String (unique, required),
  ip: String,
  userAgent: String,
  createdAt: Date (TTL: 24 hours)
}
```

---

## 🔒 Security Features

### Password Security
- Bcrypt hashing with 12 rounds
- Never logged in plain text
- Minimum 6 characters required

### JWT Tokens
- 24-hour expiration
- Signed with secret key
- Contains user ID, email, and name

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Registration: Standard rate limiting

### Input Validation
- Email format validation
- Password length validation
- Name length validation
- SQL injection prevention (MongoDB)

### Logging
- Security events logged
- Activity tracking
- No sensitive data in logs

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Environment Variables (Optional)
```bash
# .env file
PORT=4000
MULTIPLAYER_PORT=4010
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
MONGODB_URI=mongodb://localhost:27017/blackvortex
```

### 3. Start Servers
```bash
# Start both servers
npm start

# Or start individually
npm run auth
npm run multiplayer
```

### 4. Verify
```bash
# Check auth server
curl http://localhost:4000/api/auth/profile

# Check multiplayer server
curl http://localhost:4010/health
```

---

## 📊 Admin Credentials

**Admin Login:**
- Email: `admin@blackvortex.com`
- Password: `admin123`

**Test User:**
- Email: `test@example.com`
- Password: `password123`

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is installed and running
- Check MONGODB_URI environment variable
- Server will fallback to in-memory storage

### "JWT token invalid"
- Check JWT_SECRET matches between requests
- Token may have expired (24h limit)
- Ensure Bearer prefix in Authorization header

### "Rate limit exceeded"
- Wait 15 minutes between login attempts
- Use different IP address
- Contact admin to reset limits

---

**Backend is fully functional and ready for production!** 🚀