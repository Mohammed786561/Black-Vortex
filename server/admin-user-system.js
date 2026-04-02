// Admin User System for Black Vortex
// Creates a special admin user with access to all user data

const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Admin user credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@blackvortex.com',
  password: 'admin123', // In production, this should be a strong password
  name: 'System Administrator'
};

// Initialize admin user if not exists
async function initializeAdminUser() {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    let users = [];
    
    try {
      const data = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      // File doesn't exist, will be created
    }

    // Check if admin user exists
    const adminExists = users.some(user => user.email === ADMIN_CREDENTIALS.email);
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
      const adminUser = {
        id: Date.now().toString(),
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      users.push(adminUser);
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      console.log('Admin user created:', ADMIN_CREDENTIALS.email);
    }
  } catch (err) {
    console.error('Error initializing admin user:', err);
  }
}

// Admin authentication middleware
function isAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.session.user.email !== ADMIN_CREDENTIALS.email) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

// Admin login endpoint
router.post('/api/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email !== ADMIN_CREDENTIALS.email) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }
    
    // For admin, we'll use a simple password check (in production use bcrypt)
    if (password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }
    
    // Set admin session
    req.session.user = {
      id: 'admin',
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      role: 'admin'
    };
    
    res.json({
      success: true,
      message: 'Admin login successful',
      user: req.session.user
    });
    
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin login' 
    });
  }
});

// Get all users (Admin only)
router.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    let users = [];
    
    try {
      const data = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      return res.json({ users: [] });
    }
    
    // Return all user data (including passwords for admin view)
    res.json({ 
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password, // Admin can see hashed passwords
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isActive: true
      }))
    });
    
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Delete user (Admin only)
router.delete('/api/admin/users/:userId', isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const usersPath = path.join(__dirname, 'users.json');
    
    let users = [];
    try {
      const data = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      return res.status(404).json({ message: 'Users file not found' });
    }
    
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting admin
    if (users[userIndex].email === ADMIN_CREDENTIALS.email) {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    
    res.json({ 
      message: 'User deleted successfully',
      deletedUser: deletedUser.name
    });
    
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Admin dashboard stats
router.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    let users = [];
    
    try {
      const data = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      users = [];
    }
    
    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      totalRegularUsers: users.filter(u => !u.role || u.role === 'user').length,
      recentRegistrations: users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(u => ({ name: u.name, email: u.email, date: u.createdAt }))
    };
    
    res.json({ stats });
    
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Initialize admin user on startup
initializeAdminUser();

module.exports = router;