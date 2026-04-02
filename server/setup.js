#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Black Vortex Server Setup');
console.log('============================\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 16) {
    console.error('❌ Node.js version 16.0.0 or higher is required');
    console.error(`   Current version: ${nodeVersion}`);
    process.exit(1);
}

console.log(`✓ Node.js version: ${nodeVersion}`);

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
}

console.log('✓ package.json found');

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✓ Dependencies installed successfully');
} catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
}

// Create necessary directories
const dirs = ['logs', 'data', 'backups'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    }
});

// Create environment template
const envTemplate = `# Black Vortex Environment Configuration
# Copy this file to .env and set your values

# Server Configuration
NODE_ENV=development
MULTIPLAYER_PORT=4010

# AI Coach (Optional)
# GEMINI_API_KEY=your-gemini-api-key-here

# Security
# JWT_SECRET=your-jwt-secret-key-here
`;

const envPath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✓ Created .env.example file');
}

// Create README for server
const serverReadme = `# Black Vortex Server

## Quick Start

\`\`\`bash
# Start authentication server
npm run auth

# Start multiplayer server  
npm run multiplayer

# Development mode with auto-restart
npm run dev
npm run dev-multiplayer
\`\`\`

## Endpoints

### Authentication Server (Port 4000)
- \`POST /api/register\` - User registration
- \`POST /api/login\` - User login
- \`POST /api/admin-login\` - Admin login
- \`GET /api/admin-data\` - Admin logs
- \`GET /api/admin/users\` - Get all users
- \`DELETE /api/admin/users/:id\` - Delete user

### Multiplayer Server (Port 4010)
- \`GET /health\` - Server health
- \`GET /api/multiplayer/meta\` - Game metadata
- \`POST /api/multiplayer/coach\` - AI coach tips
- \`WebSocket /\` - Real-time game communication

## Environment Variables

See \`.env.example\` for configuration options.

## Logs

- Authentication logs: \`logs/admin_activity.log\`
- Multiplayer logs: Console output

## Security

- Change default admin credentials
- Use HTTPS in production
- Set JWT_SECRET for production
- Never commit API keys to version control
`;

const readmePath = path.join(__dirname, 'README.md');
if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, serverReadme);
    console.log('✓ Created server README');
}

console.log('\n✅ Setup completed successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Run "npm run auth" to start the authentication server');
console.log('2. Run "npm run multiplayer" to start the multiplayer server');
console.log('3. Open index.html in your browser to start playing');
console.log('\n🔗 Health Checks:');
console.log('   Auth: http://localhost:4000/health');
console.log('   Multiplayer: http://localhost:4010/health');