const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;
const USERS_FILE = 'users.json';
const SCORES_FILE = 'scores.json';

// Helper functions to read/write files
const readFile = (file) => {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const writeFile = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    writeFile(USERS_FILE, users);
    
    res.status(201).send('User registered');
});

// User authentication
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);
    
    const user = users.find(user => user.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }
    res.send('Login successful');
});

// Game score submission
app.post('/submit-score', (req, res) => {
    const { username, score } = req.body;
    const scores = readFile(SCORES_FILE);
    
    scores.push({ username, score });
    writeFile(SCORES_FILE, scores);
    
    res.send('Score submitted');
});

// Leaderboard
app.get('/leaderboard', (req, res) => {
    const scores = readFile(SCORES_FILE);
    const leaderboard = scores.sort((a, b) => b.score - a.score);
    
    res.json(leaderboard);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
