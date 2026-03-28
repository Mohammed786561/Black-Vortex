// Authentication System for Login and Registration

// Variables to store user data
let users = [];

// Function to register a new user
function register(username, password) {
    if (users.find(user => user.username === username)) {
        alert('Username already exists!');
        return false;
    }
    users.push({ username, password });
    alert('Registration successful!');
    return true;
}

// Function to login an existing user
function login(username, password) {
    const user = users.find(user => user.username === username);
    if (user && user.password === password) {
        alert('Login successful!');
        return true;
    }
    alert('Invalid username or password!');
    return false;
}

// Example of how to use the functions
// register('testuser', 'testpassword');
// login('testuser', 'testpassword');
