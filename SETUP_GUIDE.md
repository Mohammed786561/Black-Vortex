# Black Vortex Setup Guide

## Prerequisites

### Required Software
- **Node.js** (version 16.0.0 or higher)
- **npm** (version 8.0.0 or higher)

### Installation
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node --version  # Should show v16.0.0 or higher
   npm --version   # Should show 8.0.0 or higher
   ```

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start Servers

#### Option A: Start Both Servers
```bash
# Start authentication server (port 4000)
start-auth.bat

# Start multiplayer server (port 4010)
start-multiplayer.bat
```

#### Option B: Start Individual Servers
```bash
# Authentication Server only
node start-server.js

# Multiplayer Server only
node multiplayer-server.js
```

### 3. Launch Game
1. Open `index.html` in your browser
2. Configure your match settings
3. Click "Join Online Match"

## Server Configuration

### Authentication Server (Port 4000)
- **Purpose**: User registration, login, and admin functions
- **Admin Credentials**: admin@blackvortex.com / admin123
- **Features**:
  - AI-powered Google email verification
  - User registration and login
  - Admin dashboard for user management

### Multiplayer Server (Port 4010)
- **Purpose**: Real-time game server with matchmaking
- **Features**:
  - 1v1, 2v2, 3v3, 4v4 matchmaking
  - 4 unique maps with custom layouts
  - AI coach integration (requires GEMINI_API_KEY)
  - Real-time combat and scoring

## Environment Variables

### For AI Coach (Optional)
To enable AI coach functionality in the multiplayer server, set:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### For Production
```bash
export NODE_ENV="production"
export MULTIPLAYER_PORT="4010"
```

## Troubleshooting

### Common Issues

#### "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :4000
# Kill the process if needed
taskkill /PID <process-id> /F
```

#### "Cannot find module"
```bash
# Reinstall dependencies
cd server
npm install --force
```

#### "Connection refused"
1. Ensure both servers are running
2. Check firewall settings
3. Verify ports 4000 and 4010 are not blocked

### Server Health Checks
- Authentication Server: http://localhost:4000/health
- Multiplayer Server: http://localhost:4010/health

## Development

### Running Tests
```bash
npm test  # If tests are available
```

### Development Mode
```bash
# With auto-restart on changes
npm run dev
```

### Logs
- Authentication logs: `server/logs/admin_activity.log`
- Multiplayer logs: Console output

## Security Notes

1. **Never commit API keys** to version control
2. **Use HTTPS** in production environments
3. **Change default admin credentials** before deployment
4. **Regularly update dependencies** for security patches

## Performance Tips

1. **Allocate sufficient memory** for Node.js:
   ```bash
   node --max-old-space-size=4096 start-server.js
   ```

2. **Use a process manager** for production:
   ```bash
   npm install -g pm2
   pm2 start start-server.js
   ```

3. **Monitor resource usage** during peak times

## Support

For issues or questions:
1. Check this setup guide first
2. Review server logs for error details
3. Ensure all prerequisites are met
4. Verify network connectivity and firewall settings