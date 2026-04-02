// Black Vortex Application Logic
// This file contains the main application state and navigation functions

// Application state
const state = {
  loggedIn: false,
  user: null,
  currentGame: null,
  selectedLoadout: null
};

// Navigation function
function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });
  
  // Show the requested page
  const targetPage = document.getElementById(page);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
  
  // Update active navigation
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`.nav-links a[data-route="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Show login modal
function showLogin() {
  document.getElementById('login-modal').classList.remove('hidden');
}

// Hide login modal
function hideLogin() {
  document.getElementById('login-modal').classList.add('hidden');
}

// Select loadout set
function selectSet(setName) {
  // Update UI to show selected set
  document.querySelectorAll('.loadout-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Find and highlight the selected card
  const selectedCard = event.currentTarget;
  selectedCard.classList.add('selected');
  
  // Update display
  document.getElementById('chosenSet').textContent = `Selected: ${setName}`;
  
  // Store selection
  state.selectedLoadout = setName;
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-route');
      navigate(page);
    });
  });
  
  // Set up modal close button
  const closeLogin = document.getElementById('close-login');
  if (closeLogin) {
    closeLogin.addEventListener('click', () => {
      document.getElementById('login-modal').classList.add('hidden');
    });
  }
  
  // Set up profile button
  const profileBtn = document.getElementById('btn-profile');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (state.loggedIn) {
        navigate('profile');
      } else {
        showLogin();
      }
    });
  }
  
  // Initialize welcome message
  if (!state.loggedIn) {
    document.getElementById('welcome-user').textContent = 'Welcome, Operative';
  }
});
