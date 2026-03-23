const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 4000;
const USER_DATA_DIR = path.join(__dirname, 'userdata');

// Middleware
app.use(express.json());

// Create userdata directory if it doesn't exist
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  console.log('Created userdata directory');
}

// AI-style validation function
function validateUserInput(email, password) {
  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Check password strength
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }

  return { valid: true, message: 'Valid input' };
}

// Helper function to get user file path
function getUserFilePath(email) {
  const safeEmail = email.replace(/[@.]/g, '_');
  return path.join(USER_DATA_DIR, `${safeEmail}.json`);
}

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateUserInput(email, password);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }

    // Check if user already exists
    const userFilePath = getUserFilePath(email);
    if (fs.existsSync(userFilePath)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data
    const userData = {
      email: email,
      password: hashedPassword,
      created: new Date().toISOString()
    };

    // Save user data to file
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateUserInput(email, password);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }

    // Check if user file exists
    const userFilePath = getUserFilePath(email);
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Read user data
    const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Wrong password' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      email: userData.email 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});