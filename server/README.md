# Black Vortex API

A comprehensive backend API for the Black Vortex game application, providing authentication, user management, friends system, matchmaking, and statistics tracking.

## Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **User Management**: Complete CRUD operations for user profiles and settings
- **Friends System**: Add, remove, and search for friends
- **Matchmaking**: Create and join matches with real-time player tracking
- **Statistics**: Track kills, deaths, wins, losses, and player progression
- **Leaderboard**: Global ranking system based on player performance
- **Security**: Rate limiting, CORS, and security headers

## Tech Stack

- Node.js
- Express.js
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- helmet (security headers)
- express-rate-limit (rate limiting)
- uuid (unique identifiers)
- File-based database (JSON)

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. The API will be available at `http://localhost:4000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Friends

- `POST /api/friends/add` - Add a friend (protected)
- `DELETE /api/friends/:friendId` - Remove a friend (protected)
- `GET /api/friends` - Get friends list (protected)
- `GET /api/users/search?q=query` - Search users (protected)

### Matches

- `POST /api/matches/create` - Create a new match (protected)
- `POST /api/matches/:matchId/join` - Join a match (protected)
- `GET /api/matches` - Get active matches (protected)
- `POST /api/matches/:matchId/stats` - Update match statistics (protected)

### Statistics

- `GET /api/leaderboard` - Get global leaderboard (protected)

### System

- `GET /health` - Health check endpoint

## Database Structure

The API uses a file-based JSON database system with the following structure:

### Users
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "password": "hashed",
  "createdAt": "ISO date",
  "lastLogin": "ISO date",
  "stats": {
    "kills": 0,
    "deaths": 0,
    "wins": 0,
    "losses": 0,
    "matchesPlayed": 0,
    "level": 1,
    "xp": 0,
    "rank": "Rookie"
  },
  "friends": ["user_id_array"],
  "blocked": ["user_id_array"],
  "loadout": {
    "primary": "weapon_type",
    "secondary": "weapon_type",
    "equipment": "equipment_type",
    "selectedSet": "string"
  },
  "settings": {
    "graphics": "quality",
    "audio": 100,
    "sensitivity": 50,
    "crosshair": "style"
  },
  "achievements": [],
  "inventory": {
    "weapons": [],
    "skins": [],
    "currency": 0
  }
}
```

### Matches
```json
{
  "id": "uuid",
  "map": "map_name",
  "mode": "game_mode",
  "status": "waiting|in_progress|finished",
  "players": 10,
  "currentPlayers": 1,
  "host": "user_id",
  "createdAt": "ISO date",
  "startedAt": "ISO date",
  "endedAt": "ISO date"
}
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication with 24-hour expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Cross-origin resource sharing enabled
- **Security Headers**: Helmet.js for security best practices
- **Input Validation**: Comprehensive validation for all endpoints

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Development

For development with auto-restart:

```bash
npm run dev
```

## Error Handling

The API includes comprehensive error handling for:
- Invalid requests
- Authentication failures
- Database errors
- Rate limiting
- Missing fields
- Duplicate entries

## Response Format

All API responses follow this format:

```json
{
  "message": "Success message",
  "data": { /* response data */ },
  "error": "Error message (if any)"
}
```

## Usage Examples

### Register a User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "securepassword"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player1@example.com",
    "password": "securepassword"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer your-jwt-token"
```

## File Structure

```
server/
├── server.js          # Main server file
├── package.json       # Dependencies
├── README.md          # This file
├── data/              # Database directory
│   ├── users.json     # User data
│   ├── matches.json   # Match data
│   └── leaderboard.json # Leaderboard data
└── sessions/          # Session storage (created on login)
```

## Notes

- The API uses file-based storage for simplicity. In production, consider using a proper database like MongoDB or PostgreSQL.
- JWT tokens expire after 24 hours for security.
- All protected endpoints require a valid JWT token in the Authorization header.
- The API includes comprehensive logging for debugging and monitoring.