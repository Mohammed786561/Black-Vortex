#!/usr/bin/env node

/**
 * Black Vortex Server Launcher
 * Starts both the authentication API and multiplayer server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const AUTH_PORT = process.env.PORT || 4000;
const MULTIPLAYER_PORT = process.env.MULTIPLAYER_PORT || 4010;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(prefix, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}]${colors.reset} ${message}`);
}

function checkDependencies() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('SETUP', 'Dependencies not installed. Installing now...', colors.yellow);
    return false;
  }
  
  if (!fs.existsSync(packageJsonPath)) {
    log('ERROR', 'package.json not found!', colors.red);
    process.exit(1);
  }
  
  return true;
}

function installDependencies() {
  return new Promise((resolve, reject) => {
    log('SETUP', 'Installing dependencies...', colors.cyan);
    const npm = spawn('npm', ['install'], { 
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        log('SETUP', 'Dependencies installed successfully!', colors.green);
        resolve();
      } else {
        log('ERROR', 'Failed to install dependencies', colors.red);
        reject(new Error('npm install failed'));
      }
    });
  });
}

function startServer(serverFile, name, port) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, serverFile);
    
    if (!fs.existsSync(serverPath)) {
      log('ERROR', `${serverFile} not found!`, colors.red);
      reject(new Error(`${serverFile} not found`));
      return;
    }
    
    log(name, `Starting on port ${port}...`, colors.cyan);
    
    const server = spawn('node', [serverPath], {
      cwd: __dirname,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, PORT: port, MULTIPLAYER_PORT: port }
    });
    
    let started = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`${colors.magenta}[${name}]${colors.reset} ${output}`);
      
      // Check if server started successfully
      if (output.includes('running on') || output.includes('listening on') || output.includes('started')) {
        if (!started) {
          started = true;
          log(name, `✓ Started successfully on port ${port}`, colors.green);
          resolve(server);
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error(`${colors.red}[${name} ERROR]${colors.reset} ${data.toString()}`);
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        log(name, `Server exited with code ${code}`, colors.red);
      }
    });
    
    server.on('error', (error) => {
      log(name, `Failed to start: ${error.message}`, colors.red);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!started) {
        log(name, 'Server may still be starting...', colors.yellow);
        resolve(server);
      }
    }, 10000);
  });
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                  BLACK VORTEX SERVER                       ║
║                  Game Server Launcher                      ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  // Check and install dependencies if needed
  if (!checkDependencies()) {
    try {
      await installDependencies();
    } catch (error) {
      log('ERROR', 'Failed to install dependencies. Please run: npm install', colors.red);
      process.exit(1);
    }
  }
  
  const servers = [];
  
  try {
    // Start Authentication Server
    log('MAIN', 'Starting Authentication Server...', colors.bright);
    const authServer = await startServer('auth-api.js', 'AUTH', AUTH_PORT);
    servers.push(authServer);
    
    // Wait a bit before starting multiplayer server
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start Multiplayer Server
    log('MAIN', 'Starting Multiplayer Server...', colors.bright);
    const multiplayerServer = await startServer('multiplayer-server-improved.js', 'MULTIPLAYER', MULTIPLAYER_PORT);
    servers.push(multiplayerServer);
    
    console.log(`
${colors.bright}${colors.green}╔════════════════════════════════════════════════════════════╗
║                  SERVERS STARTED SUCCESSFULLY              ║
╠════════════════════════════════════════════════════════════╣
║  Auth Server:      http://localhost:${AUTH_PORT}                      ║
║  Multiplayer:      ws://localhost:${MULTIPLAYER_PORT}                        ║
║  Health Check:     http://localhost:${MULTIPLAYER_PORT}/health            ║
║  API:              http://localhost:${MULTIPLAYER_PORT}/api/multiplayer   ║
╠════════════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop all servers                         ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
    `);
    
    // Handle graceful shutdown
    const shutdown = () => {
      log('MAIN', 'Shutting down servers...', colors.yellow);
      servers.forEach(server => {
        if (server && !server.killed) {
          server.kill('SIGTERM');
        }
      });
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    log('ERROR', `Failed to start servers: ${error.message}`, colors.red);
    servers.forEach(server => {
      if (server && !server.killed) {
        server.kill('SIGTERM');
      }
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { startServer, checkDependencies };