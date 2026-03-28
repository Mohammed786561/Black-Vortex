// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

// Constants
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret'; // replace with your actual secret

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect('mongodb://localhost:27017/black_vortex', { useNewUrlParser: true, useUnifiedTopology: true });

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    score: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/api/register', [
    check('username').isLength({ min: 3 }),
    check('password').isLength({ min: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send('User created');
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token });
});

// Score submission endpoint
app.post('/api/submit_score', async (req, res) => {
    const { token, score } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, { score });
    res.send('Score submitted');
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
    const users = await User.find().sort({ score: -1 }).limit(10);
    res.json(users);
});

// Error handling
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});