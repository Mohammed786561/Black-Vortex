// fixed-server.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error: ', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered');
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
        res.json({ token });
    } else {
        res.status(403).send('Invalid credentials');
    }
});

// Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
    username: String,
    score: Number,
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// Add score to leaderboard
app.post('/leaderboard', async (req, res) => {
    const { username, score } = req.body;
    const leaderboardEntry = new Leaderboard({ username, score });
    await leaderboardEntry.save();
    res.status(201).send('Score added to leaderboard');
});

// Get leaderboard
app.get('/leaderboard', async (req, res) => {
    const entries = await Leaderboard.find().sort({ score: -1 });
    res.json(entries);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Server startup
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
