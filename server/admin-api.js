const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const LOG_FOLDER = path.join(__dirname, 'logs');
const DATA_FOLDER = path.join(__dirname, 'data');

// Ensure folders exist
if (!fs.existsSync(LOG_FOLDER)) fs.mkdirSync(LOG_FOLDER);
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// Security middleware
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// --- ADMIN API FUNCTIONS ---

// 1. Check if user exists in our database
function aiCheckUser(email) {
    const userFile = path.join(DATA_FOLDER, `${email}.json`);
    if (fs.existsSync(userFile)) {
        return JSON.parse(fs.readFileSync(userFile, 'utf8'));
    }
    return null;
}

// 2. Save new user (Register)
function aiSaveUser(email, password) {
    const userData = {
        id: Date.now().toString(),
        email: email,
        password: password, // In a real app, never save plain text passwords!
        createdAt: new Date().toISOString()
    };
    const userFile = path.join(DATA_FOLDER, `${email}.json`);
    fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
    return userData;
}

// 3. Get all users (Admin function)
function aiGetAllUsers() {
    const users = [];
    const files = fs.readdirSync(DATA_FOLDER);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const userData = JSON.parse(fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8'));
            users.push(userData);
        }
    });
    return users;
}

// 4. Delete user (Admin function)
function aiDeleteUser(userId) {
    const files = fs.readdirSync(DATA_FOLDER);
    for (const file of files) {
        if (file.endsWith('.json')) {
            const userData = JSON.parse(fs.readFileSync(path.join(DATA_FOLDER, file), 'utf8'));
            if (userData.id === userId) {
                fs.unlinkSync(path.join(DATA_FOLDER, file));
                return { success: true };
            }
        }
    }
    return { success: false };
}

// 5. Log Attempt (Saves to Admin)
function aiLogAttempt(email, password, success, ip, reason) {
    const logEntry = {
        type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        id: Date.now().toString(),
        email: email,
        password: password,
        ip: ip || 'unknown',
        reason: reason,
        timestamp: new Date().toISOString()
    };
    const logFile = path.join(LOG_FOLDER, 'admin_activity.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// --- ADMIN USER INITIALIZATION ---
function initializeAdminUser() {
    const adminEmail = 'admin@blackvortex.com';
    const adminPassword = 'admin123';
    
    if (!aiCheckUser(adminEmail)) {
        console.log(`[SYSTEM]: Creating admin user: ${adminEmail}`);
        aiSaveUser(adminEmail, adminPassword);
    }
}

// Initialize admin user on startup
initializeAdminUser();

// --- ADMIN API ENDPOINTS ---

// Admin login endpoint
app.post('/api/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // HARDCODED ADMIN
        if (email === 'admin@blackvortex.com' && password === 'admin123') {
            res.json({ 
                success: true, 
                message: 'Admin login successful',
                token: 'ADMIN_TOKEN'
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid admin credentials' 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get all users endpoint
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = aiGetAllUsers();
        res.json({ 
            success: true, 
            users 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Delete user endpoint
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const result = aiDeleteUser(userId);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'User deleted successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get admin logs endpoint
app.get('/api/admin/logs', async (req, res) => {
    try {
        const logFile = path.join(LOG_FOLDER, 'admin_activity.log');
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            const data = fs.readFileSync(logFile, 'utf8');
            const lines = data.trim().split('\n');
            logs = lines.filter(line => line.trim() !== '')
                       .map(line => JSON.parse(line))
                       .reverse();
        }
        
        res.json({ 
            success: true, 
            logs 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to read logs' 
        });
    }
});

// Get system statistics endpoint
app.get('/api/admin/stats', async (req, res) => {
    try {
        const users = aiGetAllUsers();
        const logFile = path.join(LOG_FOLDER, 'admin_activity.log');
        let totalLogins = 0;
        let failedLogins = 0;
        
        if (fs.existsSync(logFile)) {
            const data = fs.readFileSync(logFile, 'utf8');
            const lines = data.trim().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    try {
                        const log = JSON.parse(line);
                        if (log.type === 'LOGIN_SUCCESS') totalLogins++;
                        if (log.type === 'LOGIN_FAILED') failedLogins++;
                    } catch (e) {
                        // Skip invalid log entries
                    }
                }
            });
        }
        
        res.json({
            success: true,
            stats: {
                totalUsers: users.length,
                totalLogins: totalLogins,
                failedLogins: failedLogins,
                adminUsers: users.filter(u => u.email === 'admin@blackvortex.com').length,
                regularUsers: users.filter(u => u.email !== 'admin@blackvortex.com').length
            }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get statistics' 
        });
    }
});

// --- USER API ENDPOINTS (for compatibility) ---

// User register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email is valid Google format
        if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Registration failed: Only Google emails (@gmail.com) are allowed.' 
            });
        }

        if (aiCheckUser(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        aiSaveUser(email, password);
        res.status(201).json({ 
            success: true, 
            message: 'User Registered' 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server Error' 
        });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = aiCheckUser(email);
        if (!user) {
            aiLogAttempt(email, password, false, req.ip, "Account not found");
            return res.status(401).json({ 
                success: false, 
                message: 'Account not found. Please register.' 
            });
        }

        if (user.password !== password) {
            aiLogAttempt(email, password, false, req.ip, "Incorrect password");
            return res.status(401).json({ 
                success: false, 
                message: 'Incorrect password.' 
            });
        }

        // Success
        aiLogAttempt(email, password, true, req.ip, "Success");
        res.json({ 
            success: true, 
            message: 'Login Successful', 
            user: user 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server Error' 
        });
    }
});

// --- START SERVER ---

app.listen(PORT, () => {
    console.log(`🚀 Admin API Server running on http://localhost:${PORT}`);
    console.log(`🛡️  Admin Panel: Open simple-admin-interface.html in your browser`);
    console.log(`🔑 Admin Credentials: admin@blackvortex.com / admin123`);
    console.log(`📊 API Endpoints:`);
    console.log(`   POST /api/admin-login - Admin authentication`);
    console.log(`   GET  /api/admin/users - Get all users`);
    console.log(`   DELETE /api/admin/users/:id - Delete user`);
    console.log(`   GET  /api/admin/logs - Get activity logs`);
    console.log(`   GET  /api/admin/stats - Get system statistics`);
});

module.exports = app;