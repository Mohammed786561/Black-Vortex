// USER DATA MANAGEMENT SYSTEM
// Add this script to your Black Vortex FPS game

// Save user data to localStorage (simulates saving to userData folder)
function saveUserData(email, password) {
  // Get existing users or create empty object
  let users = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Add/update user data
  users[email] = {
    email: email,
    password: password,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  
  // Save to localStorage (simulates saving to userData folder)
  localStorage.setItem('userData', JSON.stringify(users));
}

// Load all user data
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