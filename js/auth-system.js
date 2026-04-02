// Authentication and Navigation System
// This file provides login functionality and navigation handling

// State management
let state = {
  loggedIn: false,
  user: null
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in (localStorage)
  const savedUser = localStorage.getItem('bv_user');
  if (savedUser) {
    state.user = JSON.parse(savedUser);
    state.loggedIn = true;
    showDashboard();
    updateUI();
  } else {
    showLogin();
  }

  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
rt
  // Navigation
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.getAttribute('data-route');
      navigate(target);
    });
  });

  // Profile button
  const profileBtn = document.getElementById('btn-profile');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (!state.loggedIn) {
        showLogin();
        return;
      }
      navigate('profile');
    });
  }

  // Play buttons
  document.getElementById('play-now')?.addEventListener('click', playGame);
  document.getElementById('quick-match')?.addEventListener('click', playGame);
  document.getElementById('ranked')?.addEventListener('click', playGame);

  // Close login modal
  document.getElementById('close-login')?.addEventListener('click', () => {
    document.getElementById('login-modal').classList.add('hidden');
    if (!state.loggedIn) {
      showLogin();
    }
  });

  // Friend search
  document.getElementById('friend-search')?.addEventListener('input', searchUsers);

  // Toggle between login and register
  document.getElementById('show-login')?.addEventListener('click', () => {
    document.getElementById('auth-title').textContent = 'SECURE ACCESS REQUIRED';
    document.getElementById('username').classList.add('hidden');
    document.getElementById('username').required = false;
  });

  document.getElementById('show-register')?.addEventListener('click', () => {
    document.getElementById('auth-title').textContent = 'CREATE ACCOUNT';
    document.getElementById('username').classList.remove('hidden');
    document.getElementById('username').required = true;
  });
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  
  // Check if we're registering or logging in
  const isRegistering = document.getElementById('username').classList.contains('hidden') === false;
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }

  if (isRegistering && !username) {
    alert('Please enter a username');
    return;
  }

  // Try server authentication first
  try {
    if (isRegistering) {
      // Register with Black Vortex server
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login with your credentials.');
        // Switch to login form
        document.getElementById('auth-title').textContent = 'SECURE ACCESS REQUIRED';
        document.getElementById('username').classList.add('hidden');
        document.getElementById('username').required = false;
      } else {
        alert('Registration failed: ' + (data.error || 'Server error'));
      }
    } else {
      // Login with Black Vortex server
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        state.user = data.user;
        state.loggedIn = true;
        localStorage.setItem('bv_user', JSON.stringify(data.user));
        localStorage.setItem('bv_token', data.token);
        document.getElementById('login-modal').classList.add('hidden');
        showDashboard();
        updateUI();
        alert('Welcome to Black Vortex!');
      } else {
        // Login failed - show specific error message
        const errorMessage = data.error || 'Authentication failed';
        alert('Login Failed: ' + errorMessage);
      }
    }
  } catch (err) {
    console.error('Server authentication error:', err);
    
    // Fallback to local authentication with proper validation
    const users = JSON.parse(localStorage.getItem('bv_users') || '[]');
    
    if (isRegistering) {
      // Local registration
      if (users.find(u => u.email === email)) {
        alert('Registration failed: Email already exists');
        return;
      }
      
      const newUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        password: password, // In real app, hash this
        createdAt: new Date().toISOString(),
        stats: {
          kills: 0,
          wins: 0,
          rank: 'Rookie'
        },
        loadout: 'Default Set'
      };
      
      users.push(newUser);
      localStorage.setItem('bv_users', JSON.stringify(users));
      
      alert('Registration successful! Please login with your credentials.');
      document.getElementById('auth-title').textContent = 'SECURE ACCESS REQUIRED';
      document.getElementById('username').classList.add('hidden');
      document.getElementById('username').required = false;
      
    } else {
      // Local login with proper validation
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Login successful
        state.user = user;
        state.loggedIn = true;
        localStorage.setItem('bv_user', JSON.stringify(user));
        document.getElementById('login-modal').classList.add('hidden');
        showDashboard();
        updateUI();
        alert('Welcome to Black Vortex!');
      } else {
        // Login failed - wrong credentials
        alert('Login Failed: Invalid email or password');
      }
    }
  }
}

function showLogin() {
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('home').classList.add('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('home').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  
  // Update welcome message
  if (state.user) {
    document.getElementById('welcome-user').textContent = `Welcome, ${state.user.email.split('@')[0]}`;
  }
}

function navigate(page) {
  if (!state.loggedIn) {
    showLogin();
    return;
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  
  // Show selected page
  document.getElementById(page).classList.remove('hidden');
}

function playGame() {
  if (!state.loggedIn) {
    showLogin();
    return;
  }
  
  // Show play options modal
  document.getElementById('play-options-modal').classList.remove('hidden');
}

function searchUsers(e) {
  const query = e.target.value.toLowerCase();
  // Simple mock search - in real app this would call API
  const mockResults = [
    { id: '1', name: 'Player1', status: 'Online' },
    { id: '2', name: 'Player2', status: 'Offline' },
    { id: '3', name: 'Player3', status: 'In Game' }
  ].filter(user => user.name.toLowerCase().includes(query));

  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = mockResults.map(user => `
    <div class="friend-card">
      <div class="avatar">${user.name[0]}</div>
      <div>
        <div>${user.name}</div>
        <div class="muted">${user.status}</div>
      </div>
    </div>
  `).join('');
}

function selectSet(set) {
  if (!state.loggedIn) {
    showLogin();
    return;
  }
  
  // Update selected loadout
  const loadoutCards = document.querySelectorAll('.loadout-card');
  loadoutCards.forEach(card => card.classList.remove('selected'));
  
  // Find the clicked card and add selected class
  const clickedCard = event.currentTarget;
  clickedCard.classList.add('selected');
  
  // Update state
  if (state.user) {
    state.user.loadout = set;
    localStorage.setItem('bv_user', JSON.stringify(state.user));
  }
  
  document.getElementById('chosenSet').textContent = `Selected: ${set}`;
  alert(`Loadout set to: ${set}`);
}

// Expose functions globally for onclick handlers
window.navigate = navigate;
window.playGame = playGame;
window.selectSet = selectSet;
