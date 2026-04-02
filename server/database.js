/**
 * Black Vortex - Database Configuration
 * MongoDB integration with Mongoose
 */

const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blackvortex';

// Connect to MongoDB
async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${MONGODB_URI}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Falling back to in-memory storage');
    return false;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 24
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  totalKills: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeaths: {
    type: Number,
    default: 0,
    min: 0
  },
  totalMatches: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWins: {
    type: Number,
    default: 0,
    min: 0
  },
  bestScore: {
    type: Number,
    default: 0,
    min: 0
  },
  bestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  favoriteOperator: {
    type: String,
    default: 'Nova'
  },
  favoriteLoadout: {
    type: String,
    default: 'Assault Set'
  },
  favoriteMap: {
    type: String,
    default: 'Neon Foundry'
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ level: -1 });

// Match History Schema
const matchHistorySchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['1v1', '2v2', '3v3', '4v4']
  },
  map: {
    type: String,
    required: true
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw'],
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  kills: {
    type: Number,
    default: 0
  },
  deaths: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  damage: {
    type: Number,
    default: 0
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  creditsEarned: {
    type: Number,
    default: 0
  },
  operator: String,
  loadout: String,
  weapon: String,
  duration: Number, // in seconds
  playedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

matchHistorySchema.index({ playerId: 1, playedAt: -1 });
matchHistorySchema.index({ matchId: 1 });

// Session Schema (for tracking active sessions)
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  ip: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours
  }
});

sessionSchema.index({ token: 1 });
sessionSchema.index({ userId: 1 });

// Create models
const User = mongoose.model('User', userSchema);
const MatchHistory = mongoose.model('MatchHistory', matchHistorySchema);
const Session = mongoose.model('Session', sessionSchema);

// In-memory fallback storage
const memoryStore = {
  users: new Map(),
  sessions: new Map(),
  matchHistory: []
};

// Database abstraction layer
class Database {
  constructor() {
    this.connected = false;
    this.useMemory = false;
  }

  async init() {
    this.connected = await connectDatabase();
    if (!this.connected) {
      this.useMemory = true;
      console.log('📦 Using in-memory storage');
    }
    return this.connected;
  }

  // User operations
  async createUser(userData) {
    if (this.useMemory) {
      const id = `user-${Date.now()}`;
      const user = { id, ...userData, createdAt: new Date() };
      memoryStore.users.set(userData.email, user);
      return user;
    }
    
    const user = new User(userData);
    await user.save();
    return user.toObject();
  }

  async findUserByEmail(email) {
    if (this.useMemory) {
      return memoryStore.users.get(email) || null;
    }
    
    return await User.findOne({ email }).lean();
  }

  async findUserById(id) {
    if (this.useMemory) {
      for (const user of memoryStore.users.values()) {
        if (user.id === id || user._id?.toString() === id) {
          return user;
        }
      }
      return null;
    }
    
    return await User.findById(id).lean();
  }

  async updateUser(email, updates) {
    if (this.useMemory) {
      const user = memoryStore.users.get(email);
      if (user) {
        Object.assign(user, updates);
        return user;
      }
      return null;
    }
    
    return await User.findOneAndUpdate({ email }, updates, { new: true }).lean();
  }

  async updateUserById(id, updates) {
    if (this.useMemory) {
      for (const [email, user] of memoryStore.users.entries()) {
        if (user.id === id || user._id?.toString() === id) {
          Object.assign(user, updates);
          return user;
        }
      }
      return null;
    }
    
    return await User.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  // Session operations
  async createSession(sessionData) {
    if (this.useMemory) {
      memoryStore.sessions.set(sessionData.token, sessionData);
      return sessionData;
    }
    
    const session = new Session(sessionData);
    await session.save();
    return session.toObject();
  }

  async findSession(token) {
    if (this.useMemory) {
      return memoryStore.sessions.get(token) || null;
    }
    
    return await Session.findOne({ token }).populate('userId').lean();
  }

  async deleteSession(token) {
    if (this.useMemory) {
      memoryStore.sessions.delete(token);
      return true;
    }
    
    await Session.deleteOne({ token });
    return true;
  }

  // Match history operations
  async saveMatch(matchData) {
    if (this.useMemory) {
      memoryStore.matchHistory.push(matchData);
      return matchData;
    }
    
    const match = new MatchHistory(matchData);
    await match.save();
    return match.toObject();
  }

  async getMatchHistory(playerId, limit = 10) {
    if (this.useMemory) {
      return memoryStore.matchHistory
        .filter(m => m.playerId === playerId)
        .sort((a, b) => b.playedAt - a.playedAt)
        .slice(0, limit);
    }
    
    return await MatchHistory.find({ playerId })
      .sort({ playedAt: -1 })
      .limit(limit)
      .lean();
  }

  // Friends operations
  async addFriend(userId, friendId) {
    if (this.useMemory) {
      const user = await this.findUserById(userId);
      if (user) {
        if (!user.friends) user.friends = [];
        if (!user.friends.includes(friendId)) {
          user.friends.push(friendId);
        }
        return user;
      }
      return null;
    }
    
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { friends: friendId } },
      { new: true }
    ).lean();
  }

  async getFriends(userId) {
    if (this.useMemory) {
      const user = await this.findUserById(userId);
      return user?.friends || [];
    }
    
    const user = await User.findById(userId).populate('friends').lean();
    return user?.friends || [];
  }

  // Leaderboard
  async getLeaderboard(limit = 10) {
    if (this.useMemory) {
      return Array.from(memoryStore.users.values())
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
    }
    
    return await User.find()
      .sort({ xp: -1 })
      .limit(limit)
      .select('name level xp totalKills totalDeaths')
      .lean();
  }

  // Online users
  async getOnlineUsers() {
    if (this.useMemory) {
      return Array.from(memoryStore.users.values())
        .filter(u => u.isOnline);
    }
    
    return await User.find({ isOnline: true })
      .select('name level isOnline')
      .lean();
  }
}

module.exports = new Database();