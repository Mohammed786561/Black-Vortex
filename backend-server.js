// backend-server.js

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// User data JSON file
const userDataFile = path.join(__dirname, 'users.json');

// Function to load user data
const loadUserData = () => {
    if (!fs.existsSync(userDataFile)) {
        fs.writeFileSync(userDataFile, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userDataFile));
};

// User registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = loadUserData();

    if (users[username]) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    users[username] = { password };
    fs.writeFileSync(userDataFile, JSON.stringify(users));
    res.status(201).json({ message: 'User registered successfully.' });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUserData();

    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.status(200).json({ message: 'Login successful.' });
});

// Sample game data API 
app.get('/game-data', (req, res) => {
    const gameData = [
        { id: 1, name: 'Game 1', description: 'This is game 1' },
        { id: 2, name: 'Game 2', description: 'This is game 2' }
    ];
    res.json(gameData);
});

// Leaderboard System
let leaderboard = [];

app.post('/leaderboard', (req, res) => {
    const { username, score } = req.body;
    leaderboard.push({ username, score });
    leaderboard.sort((a, b) => b.score - a.score);
    res.status(201).json(leaderboard);
});

app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
