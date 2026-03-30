// USER DATA MANAGEMENT SYSTEM - Backend Integration
// Connects to Black Vortex backend API

const API_BASE_URL = 'http://localhost:4000';

// Get auth token from storage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Set auth token
function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

// Clear auth token
function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Login with backend API
async function loginWithBackend(email, password) {
  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.success) {
      setAuthToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      trackLoginAttempt(email, true);
      return { success: true, user: data.user, token: data.token };
    }
    
    return { success: false, message: data.message };
  } catch (error) {
    trackLoginAttempt(email, false);
    return { success: false, message: error.message };
  }
}

// Register with backend API
async function registerWithBackend(email, password, name) {
  try {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    
    if (data.success) {
      setAuthToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return { success: true, user: data.user, token: data.token };
    }
    
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Google OAuth login
async function googleOAuthLogin(email) {
  try {
    const data = await apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    if (data.success) {
      setAuthToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return { success: true, user: data.user, token: data.token };
    }
    
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Logout
async function logoutFromBackend() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthToken();
    localStorage.removeItem('currentUser');
  }
}

// Get user profile from backend
async function getUserProfile() {
  try {
    const data = await apiRequest('/api/auth/profile');
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Update progress after match
async function updateProgress(matchData) {
  try {
    const data = await apiRequest('/api/user/progress', {
      method: 'POST',
      body: JSON.stringify(matchData)
    });
    
    if (data.success) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return { success: true, user: data.user, earned: data.earned, leveledUp: data.leveledUp };
    }
    
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get match history
async function getMatchHistory(limit = 10) {
  try {
    const data = await apiRequest(`/api/user/matches?limit=${limit}`);
    return { success: true, matches: data.matches };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get leaderboard
async function getLeaderboard(limit = 10) {
  try {
    const data = await apiRequest(`/api/leaderboard?limit=${limit}`);
    return { success: true, leaderboard: data.leaderboard };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get friends list
async function getFriends() {
  try {
    const data = await apiRequest('/api/friends');
    return { success: true, friends: data.friends };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Add friend
async function addFriend(targetEmail) {
  try {
    const data = await apiRequest('/api/friends/add', {
      method: 'POST',
      body: JSON.stringify({ targetEmail })
    });
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Remove friend
async function removeFriend(friendId) {
  try {
    const data = await apiRequest(`/api/friends/${friendId}`, {
      method: 'DELETE'
    });
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get online users
async function getOnlineUsers() {
  try {
    const data = await apiRequest('/api/users/online');
    return { success: true, users: data.users };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Check if user is logged in
function isLoggedIn() {
  return !!getAuthToken();
}

// Get current user from storage
function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// Save user data to localStorage (legacy support)
function saveUserData(email, password) {
  let users = JSON.parse(localStorage.getItem('userData') || '{}');
  users[email] = {
    email: email,
    password: password,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  localStorage.setItem('userData', JSON.stringify(users));
}

// Load all user data (legacy support)
function loadUserData() {
  return JSON.parse(localStorage.getItem('userData') || '{}');
}

// Track login attempts
function trackLoginAttempt(email, success) {
  let attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
  attempts.push({
    email: email,
    success: success,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('loginAttempts', JSON.stringify(attempts));
}

// Admin panel toggle function
function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
      populateAdminPanel();
    }
  }
}

// Populate admin panel with user credentials
function populateAdminPanel() {
  const users = loadUserData();
  const panel = document.getElementById('admin-panel');
  const list = document.getElementById('user-credentials-list');
  
  if (!panel || !list) return;
  
  // Update statistics
  document.getElementById('total-users-admin').textContent = Object.keys(users).length;
  
  // Find latest login
  let latest = null;
  Object.values(users).forEach(user => {
    if (!latest || new Date(user.lastLogin) > new Date(latest)) {
      latest = user.lastLogin;
    }
  });
  document.getElementById('last-login-admin').textContent = latest ? new Date(latest).toLocaleString() : 'Never';
  
  // Clear and populate list
  list.innerHTML = '';
  
  if (Object.keys(users).length === 0) {
    list.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No users registered yet.</div>';
  } else {
    Object.entries(users).forEach(([email, userData]) => {
      const card = document.createElement('div');
      card.className = 'recent-attempts';
      card.style.marginBottom = '15px';
      card.style.borderColor = '#ff4444';
      
      card.innerHTML = `
        <div class="attempt-item">
          <div style="color: #ff4444; font-weight: bold;">${email}</div>
          <div style="color: #888; font-size: 12px;">Registered: ${new Date(userData.createdAt).toLocaleString()}</div>
        </div>
        <div class="attempt-item" style="border-top: 1px solid rgba(255, 255, 255, 0.2); margin-top: 5px;">
          <div style="color: #ffffff;">Password: <span style="color: #00ff88; font-family: monospace;">${userData.password}</span></div>
          <div style="color: #888; font-size: 12px;">Last Login: ${new Date(userData.lastLogin).toLocaleString()}</div>
        </div>
      `;
      
      list.appendChild(card);
    });
  }
}

// Add this to your existing login function
function enhancedLogin(email, password) {
  // Your existing login logic here...
  
  // After successful login, save user data
  saveUserData(email, password);
  
  // Track login attempt
  trackLoginAttempt(email, true);
  
  // Update admin panel if visible
  if (document.getElementById('admin-panel') && document.getElementById('admin-panel').style.display !== 'none') {
    populateAdminPanel();
  }
}

// Add admin panel HTML to your page (add this to your HTML file)
const adminPanelHTML = `
<div class="stats-panel" id="admin-panel" style="display: none; border-color: #ff4444; border: 2px solid #ff4444;">
  <h3 style="margin-top: 0; color: #ff4444; text-transform: uppercase; letter-spacing: 2px;">Admin Panel - User Credentials</h3>
  <p style="color: #ff4444; font-size: 12px; margin-bottom: 20px;">⚠️ SECURITY WARNING: This panel shows plain-text passwords. This is for demo purposes only.</p>
  
  <div class="stats-grid">
    <div class="stat-card" style="border-color: #ff4444;">
      <div class="stat-number" id="total-users-admin" style="color: #ff4444;">0</div>
      <div class="stat-label">Total Users</div>
    </div>
    <div class="stat-card" style="border-color: #00ff88;">
      <div class="stat-number" id="last-login-admin" style="color: #00ff88;">Never</div>
      <div class="stat-label">Last Login</div>
    </div>
  </div>

  <div class="recent-attempts">
    <h4 style="margin-top: 0; color: #888;">All User Credentials</h4>
    <div id="user-credentials-list">
      <!-- User credentials will be populated here -->
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center;">
    <button class="btn-game" style="background: #ff4444; color: white;" onclick="toggleAdminPanel()">HIDE ADMIN PANEL</button>
  </div>
</div>
`;

// Add this button to your home page to access admin panel
const adminButtonHTML = `<button onclick="toggleAdminPanel()" style="background: #ff4444; color: white; border: none; padding: 10px 20px; margin: 10px; border-radius: 5px; cursor: pointer;">ADMIN PANEL</button>`;

console.log('User Data Manager loaded. Add the admin panel HTML and button to your page.');
console.log('Admin Panel HTML:', adminPanelHTML);
console.log('Admin Button HTML:', adminButtonHTML);