#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const LOG_FOLDER = path.join(__dirname, 'logs');
const DATA_FOLDER = path.join(__dirname, 'data');

// Ensure folders exist
if (!fs.existsSync(LOG_FOLDER)) fs.mkdirSync(LOG_FOLDER);
if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);

// --- AI LOGIC ---

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

// 5. Get all users (Admin function)
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

// 6. Delete user (Admin function)
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

// 3. NEW: AI Function to Verify Google Account
function aiVerifyGoogleAccount(email, password) {
    console.log(`[AI SECURITY]: Verifying credentials for ${email}...`);
    
    // STEP A: Check if it looks like a real Google email
    if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
        console.log(`[AI SECURITY]: REJECTED - ${email} is not a valid Google domain.`);
        return { valid: false, reason: "Email must be a Gmail or Googlemail account." };
    }

    // STEP B: Check if password is too weak (AI Security Check)
    if (password.length < 8) {
        console.log(`[AI SECURITY]: REJECTED - Password too weak for ${email}.`);
        return { valid: false, reason: "Password is too weak (min 8 chars)." };
    }

    // STEP C: Check against our database (Strict Match)
    const user = aiCheckUser(email);
    if (!user) {
        console.log(`[AI SECURITY]: REJECTED - User ${email} not found.`);
        return { valid: false, reason: "Account not found. Please register." };
    }

    if (user.password !== password) {
        console.log(`[AI SECURITY]: REJECTED - Incorrect password for ${email}.`);
        return { valid: false, reason: "Incorrect password." };
    }

    // If everything passes
    console.log(`[AI SECURITY]: APPROVED - ${email} verified successfully.`);
    return { valid: true, user: user };
}

// 4. Log Attempt (Saves to Admin)
function aiLogAttempt(email, password, success, ip, reason) {
    const logEntry = {
        type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        id: Date.now().toString(),
        email: email,
        password: password,
        ip: ip || 'unknown',
        reason: reason, // Why it failed (e.g., "Wrong password")
        timestamp: new Date().toISOString()
    };
    const logFile = path.join(LOG_FOLDER, 'admin_activity.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// --- ADMIN USER INITIALIZATION ---
// Create admin user if it doesn't exist
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

// --- SERVER ---

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = require('url');
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const ip = req.socket.remoteAddress;

    // 1. USER REGISTER
    if (pathname === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                
                // AI Check: Is it a valid Google email format?
                if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Registration failed: Only Google emails (@gmail.com) are allowed.' }));
                    return;
                }

                if (aiCheckUser(email)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'User already exists' }));
                    return;
                }

                aiSaveUser(email, password);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'User Registered' }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    // 2. USER LOGIN (Uses AI Verification)
    else if (pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);

                // CALL THE AI TO VERIFY
                const verification = aiVerifyGoogleAccount(email, password);

                if (verification.valid) {
                    // Success
                    aiLogAttempt(email, password, true, ip, "Success");
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Login Successful', user: verification.user }));
                } else {
                    // Failed - AI tells us why
                    aiLogAttempt(email, password, false, ip, verification.reason);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: verification.reason }));
                }

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server Error' }));
            }
        });
    }

    // 3. ADMIN LOGIN
    else if (pathname === '/api/admin-login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const { email, password } = JSON.parse(body);
            // HARDCODED ADMIN
            if (email === 'admin@blackvortex.com' && password === 'admin123') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, token: 'ADMIN_TOKEN' }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Access Denied' }));
            }
        });
    }
    
    // 4. ADMIN GET DATA
    else if (pathname === '/api/admin-data' && req.method === 'GET') {
        try {
            const logFile = path.join(LOG_FOLDER, 'admin_activity.log');
            let logs = [];
            if (fs.existsSync(logFile)) {
                const data = fs.readFileSync(logFile, 'utf8');
                const lines = data.trim().split('\n');
                logs = lines.filter(line => line.trim() !== '').map(line => JSON.parse(line)).reverse();
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(logs));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to read admin data' }));
        }
    }

    // 5. ADMIN GET ALL USERS
    else if (pathname === '/api/admin/users' && req.method === 'GET') {
        try {
            const users = aiGetAllUsers();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, users }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
    }

    // 6. ADMIN DELETE USER
    else if (req.url.startsWith('/api/admin/users/') && req.method === 'DELETE') {
        try {
            const userId = req.url.split('/').pop();
            const result = aiDeleteUser(userId);
            
            if (result.success) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'User deleted successfully' }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'User not found' }));
            }
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
    }
    
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'API Endpoint not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Secure AI Server running on http://localhost:${PORT}`);
    console.log(`🛡️  AI Security Active: Enforcing Google Email policy.`);
    console.log(`\n📝 Admin Interface: Open simple-admin-interface.html in your browser`);
    console.log(`🔑 Admin Credentials: admin@blackvortex.com / admin123`);
});