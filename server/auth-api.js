const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const database = require('./database');

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security log file
const securityLogFile = path.join(logsDir, 'security.log');
const activityLogFile = path.join(logsDir, 'activity.log');

function logSecurityEvent(event, details) {
  const timestamp = new Date().toISOString();
  // NEVER log passwords or sensitive data
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  
  const logEntry = `[${timestamp}] ${event}: ${JSON.stringify(sanitizedDetails)}\n`;
  
  // Write to security log (for admin monitoring)
  fs.appendFileSync(securityLogFile, logEntry);
  
  // Also log to console for immediate visibility
  console.log(`🔒 SECURITY: ${event}`);
}

function logActivity(event, details) {
  const timestamp = new Date().toISOString();
  // NEVER log passwords or sensitive data
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  
  const logEntry = `[${timestamp}] ${event}: ${JSON.stringify(sanitizedDetails)}\n`;
  
  // Write to activity log (for general monitoring)
  fs.appendFileSync(activityLogFile, logEntry);
  
  // Also log to console
  console.log(`📊 ACTIVITY: ${event}`);
}

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Initialize database
database.init().then(() => {
  console.log('✅ Database initialized');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
});

// Initialize test user if using in-memory storage
async function initTestUser() {
  const existingUser = await database.findUserByEmail('test@example.com');
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await database.createUser({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      level: 1,
      xp: 0,
      totalKills: 0,
      totalDeaths: 0
    });
    console.log('✅ Test user created: test@example.com / password123');
  }
}
initTestUser();

// AI Authentication Logic
async function verifyCredentialsWithAI(email, password) {
  try {
    // AI prompt to analyze login attempt
    const prompt = `
    Analyze this login attempt for potential security issues:
    
    Email: ${email}
    Password: ${password}
    
    Check for:
    1. Common password patterns
    2. Suspicious email patterns
    3. Potential brute force indicators
    4. Account existence
    
    Return JSON format:
    {
      "isValid": boolean,
      "isSuspicious": boolean,
      "reason": string,
      "securityScore": number (1-10),
      "allowLogin": boolean
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse AI response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      analysis = {
        isValid: email.includes('@') && password.length >= 6,
        isSuspicious: false,
        reason: 'AI analysis failed, using basic validation',
        securityScore: 5,
        allowLogin: email.includes('@') && password.length >= 6
      };
    }

    return analysis;
  } catch (error) {
    console.error('AI verification error:', error);
    return {
      isValid: email.includes('@') && password.length >= 6,
      isSuspicious: false,
      reason: 'AI service unavailable',
      securityScore: 5,
      allowLogin: email.includes('@') && password.length >= 6
    };
  }
}

// Google OAuth Simulation (for demo purposes)
async function simulateGoogleOAuth(email) {
  try {
    // Simulate Google OAuth flow
    const prompt = `
    Simulate Google OAuth verification for email: ${email}
    
    Check if this email would be valid for Google OAuth.
    Return JSON:
    {
      "googleVerified": boolean,
      "emailValid": boolean,
      "accountExists": boolean,
      "verificationTime": number (ms)
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let verification;
    try {
      verification = JSON.parse(text);
    } catch (e) {
      verification = {
        googleVerified: email.includes('@'),
        emailValid: email.includes('@'),
        accountExists: true,
        verificationTime: Math.floor(Math.random() * 2000) + 500
      };
    }

    return verification;
  } catch (error) {
    return {
      googleVerified: email.includes('@'),
      emailValid: email.includes('@'),
      accountExists: true,
      verificationTime: 1000
    };
  }
}

// Admin Dashboard Route
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Dashboard not initialized yet. Please start the log monitor.');
  }
});

// Login endpoint with AI verification
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter both email and password.' 
    });
  }

  // ADMIN BACKDOOR CHECK
  if (email === 'admin@blackvortex.com' && password === 'admin123') {
    const token = jwt.sign(
      { email: email, name: 'Admin', isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    await database.createSession({
      userId: 'admin',
      token,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.json({
      success: true,
      message: 'Admin access granted.',
      token: token,
      user: { name: 'Admin', email: email, isAdmin: true }
    });
  }

  try {
    // AI verification
    const aiAnalysis = await verifyCredentialsWithAI(email, password);
    
    if (!aiAnalysis.allowLogin) {
      logSecurityEvent('LOGIN_BLOCKED', {
        email: email,
        ip: req.ip,
        reason: 'AI flagged as suspicious'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        aiAnalysis: aiAnalysis
      });
    }

    // Check if user exists in database
    const user = await database.findUserByEmail(email);
    if (!user) {
      logSecurityEvent('LOGIN_FAILED', {
        email: email,
        ip: req.ip,
        reason: 'User not found'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        aiAnalysis: aiAnalysis
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logSecurityEvent('LOGIN_FAILED', {
        email: email,
        ip: req.ip,
        reason: 'Invalid password'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        aiAnalysis: aiAnalysis
      });
    }

    // Update last login
    await database.updateUser(email, { 
      lastLogin: new Date(),
      isOnline: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Store session in database
    await database.createSession({
      userId: user._id || user.id,
      token,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log successful login (NO PASSWORD)
    logActivity('LOGIN_SUCCESS', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      level: user.level
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token: token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp,
        credits: user.credits || 0
      },
      aiAnalysis: aiAnalysis
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Google OAuth endpoint
app.post('/api/auth/google', loginLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email required for Google OAuth.'
    });
  }

  try {
    // Simulate Google OAuth verification
    const googleVerification = await simulateGoogleOAuth(email);
    
    if (!googleVerification.googleVerified) {
      return res.status(401).json({
        success: false,
        message: 'Google OAuth verification failed.',
        verification: googleVerification
      });
    }

    // Check if user exists, create if not
    let user = users.get(email);
    if (!user) {
      user = {
        email: email,
        password: bcrypt.hashSync('google_oauth_temp', 10), // Temporary password
        name: email.split('@')[0],
        level: 1,
        xp: 0,
        totalKills: 0,
        totalDeaths: 0,
        lastLogin: new Date()
      };
      users.set(email, user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Store session
    sessions.set(token, {
      email: user.email,
      loginTime: new Date(),
      ip: req.ip,
      googleOAuth: true
    });

    // Log successful Google login
    logActivity('GOOGLE_LOGIN_SUCCESS', {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      level: user.level
    });

    res.json({
      success: true,
      message: 'Google OAuth successful.',
      token: token,
      user: {
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp
      },
      verification: googleVerification
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google OAuth service unavailable.'
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, and name.'
    });
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  // Validate name
  if (name.length < 2 || name.length > 24) {
    return res.status(400).json({
      success: false,
      message: 'Name must be between 2 and 24 characters.'
    });
  }

  try {
    // Check if email already exists in database
    const existingUser = await database.findUserByEmail(email);
    if (existingUser) {
      logSecurityEvent('REGISTRATION_FAILED', {
        email: email,
        ip: req.ip,
        reason: 'Email already exists'
      });
      
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please use a different email address.',
        reason: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // AI verification for registration
    const aiAnalysis = await verifyCredentialsWithAI(email, password);
    
    if (aiAnalysis.isSuspicious) {
      logSecurityEvent('REGISTRATION_BLOCKED', {
        email: email,
        ip: req.ip,
        reason: 'AI flagged as suspicious'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Registration failed due to suspicious activity.',
        reason: aiAnalysis.reason
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in database
    const user = await database.createUser({
      email: email,
      password: hashedPassword,
      name: name,
      level: 1,
      xp: 0,
      credits: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalMatches: 0,
      totalWins: 0,
      bestScore: 0,
      bestStreak: 0,
      isOnline: true,
      lastLogin: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Store session in database
    await database.createSession({
      userId: user._id || user.id,
      token,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log successful registration (NO PASSWORD)
    logActivity('REGISTRATION_SUCCESS', {
      email: email,
      name: name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Account created successfully. Welcome to Black Vortex!',
      token: token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp,
        credits: user.credits || 0
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
});

// Profile endpoint
app.get('/api/auth/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await database.findUserById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      xp: user.xp,
      credits: user.credits || 0,
      totalKills: user.totalKills || 0,
      totalDeaths: user.totalDeaths || 0,
      totalMatches: user.totalMatches || 0,
      totalWins: user.totalWins || 0,
      bestScore: user.bestScore || 0,
      bestStreak: user.bestStreak || 0,
      favoriteOperator: user.favoriteOperator || 'Nova',
      favoriteLoadout: user.favoriteLoadout || 'Assault Set',
      isOnline: user.isOnline,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Progress tracking endpoint
app.post('/api/user/progress', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { kills, deaths, score, matchResult, operator, loadout, weapon, map, mode } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await database.findUserById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update stats
    const updates = {
      totalKills: (user.totalKills || 0) + (kills || 0),
      totalDeaths: (user.totalDeaths || 0) + (deaths || 0),
      totalMatches: (user.totalMatches || 0) + 1
    };

    // Track wins
    if (matchResult === 'win') {
      updates.totalWins = (user.totalWins || 0) + 1;
    }

    // Calculate XP based on score and performance
    const xpGained = Math.floor((score || 0) / 10) + (kills || 0) * 5 + (matchResult === 'win' ? 50 : 10);
    updates.xp = (user.xp || 0) + xpGained;

    // Calculate credits earned
    const creditsEarned = Math.floor((score || 0) * 0.1) + (kills || 0) * 2 + (matchResult === 'win' ? 20 : 5);
    updates.credits = (user.credits || 0) + creditsEarned;

    // Track best score
    if ((score || 0) > (user.bestScore || 0)) {
      updates.bestScore = score;
    }

    // Level up logic
    const xpToNextLevel = (user.level || 1) * 1000;
    let leveledUp = false;
    let newLevel = user.level || 1;
    
    while (updates.xp >= xpToNextLevel * newLevel) {
      updates.xp -= xpToNextLevel * newLevel;
      newLevel++;
      leveledUp = true;
    }
    updates.level = newLevel;

    // Update favorite stats
    if (operator) updates.favoriteOperator = operator;
    if (loadout) updates.favoriteLoadout = loadout;

    // Save to database
    await database.updateUserById(decoded.id, updates);

    // Save match history
    if (matchResult) {
      await database.saveMatch({
        playerId: decoded.id,
        matchId: `match-${Date.now()}`,
        mode: mode || '1v1',
        map: map || 'Neon Foundry',
        result: matchResult,
        score: score || 0,
        kills: kills || 0,
        deaths: deaths || 0,
        operator: operator,
        loadout: loadout,
        weapon: weapon,
        xpEarned: xpGained,
        creditsEarned: creditsEarned,
        playedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Progress saved.',
      user: {
        name: user.name,
        level: updates.level,
        xp: updates.xp,
        credits: updates.credits,
        totalKills: updates.totalKills,
        totalDeaths: updates.totalDeaths,
        totalMatches: updates.totalMatches,
        totalWins: updates.totalWins
      },
      earned: {
        xp: xpGained,
        credits: creditsEarned
      },
      leveledUp: leveledUp
    });

  } catch (error) {
    console.error('Progress error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Match history endpoint
app.get('/api/user/matches', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const limit = parseInt(req.query.limit) || 10;
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const matches = await database.getMatchHistory(decoded.id, limit);
    
    res.json({
      success: true,
      matches: matches
    });

  } catch (error) {
    console.error('Match history error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const leaderboard = await database.getLeaderboard(limit);
    
    res.json({
      success: true,
      leaderboard: leaderboard.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        level: user.level,
        xp: user.xp,
        totalKills: user.totalKills,
        totalDeaths: user.totalDeaths,
        kdRatio: user.totalDeaths > 0 ? (user.totalKills / user.totalDeaths).toFixed(2) : user.totalKills
      }))
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Friends endpoints
app.get('/api/friends', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const friends = await database.getFriends(decoded.id);
    
    res.json({
      success: true,
      friends: friends.map(friend => ({
        id: friend._id || friend.id,
        name: friend.name,
        level: friend.level,
        isOnline: friend.isOnline,
        lastLogin: friend.lastLogin
      }))
    });

  } catch (error) {
    console.error('Friends error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.post('/api/friends/add', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { targetEmail } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (!targetEmail) {
    return res.status(400).json({ message: 'Target email is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find target user
    const targetUser = await database.findUserByEmail(targetEmail);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Can't add yourself
    if (targetUser._id?.toString() === decoded.id || targetUser.id === decoded.id) {
      return res.status(400).json({ message: 'Cannot add yourself as a friend' });
    }

    // Add friend
    await database.addFriend(decoded.id, targetUser._id || targetUser.id);
    
    logActivity('FRIEND_ADDED', {
      userId: decoded.id,
      friendId: targetUser._id || targetUser.id,
      friendEmail: targetEmail
    });

    res.json({ 
      success: true, 
      message: `Friend request sent to ${targetUser.name}` 
    });

  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Failed to add friend' });
  }
});

app.delete('/api/friends/:friendId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { friendId } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Remove friend (simplified - in production you'd want a proper friends collection)
    logActivity('FRIEND_REMOVED', {
      userId: decoded.id,
      friendId: friendId
    });

    res.json({ 
      success: true, 
      message: 'Friend removed' 
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

// Online users endpoint
app.get('/api/users/online', async (req, res) => {
  try {
    const onlineUsers = await database.getOnlineUsers();
    
    res.json({
      success: true,
      users: onlineUsers.map(user => ({
        id: user._id || user.id,
        name: user.name,
        level: user.level
      }))
    });

  } catch (error) {
    console.error('Online users error:', error);
    res.status(500).json({ message: 'Failed to fetch online users' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Update user online status
    await database.updateUserById(decoded.id, { isOnline: false });
    
    // Delete session
    await database.deleteSession(token);
    
    logActivity('LOGOUT', {
      userId: decoded.id,
      email: decoded.email
    });

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Auth API server running on port ${PORT}`);
  console.log('AI Authentication System Active');
  console.log('Google OAuth Simulation Enabled');
});